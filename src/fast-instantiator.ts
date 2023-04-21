import { OptionalType } from "./optional";
import { SafeReferenceType, ReferenceType } from "./reference";
import { DateType, LiteralType } from "./simple";
import { IntegerType, SimpleType } from "./simple";
import type { IAnyClassModelType, IAnyType, IClassModelType, Instance, InstantiateContext, SnapshotIn, ValidOptionalValue } from "./types";
import { $identifier } from "./symbols";
import { MapType, QuickMap } from "./map";
import { LateType } from "./late";

export const $fastInstantiator = Symbol.for("mqt:class-model-instantiator");

export type CompiledInstantiator<T extends IAnyClassModelType = IAnyClassModelType> = (
  instance: Instance<T>,
  snapshot: SnapshotIn<T>,
  context: InstantiateContext
) => void;

/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
export const buildFastInstantiator = <T extends IClassModelType<Record<string, IAnyType>, any, any>>(model: T): CompiledInstantiator<T> => {
  return new InstantiatorBuilder(model).build();
};

type DirectlyAssignableType = SimpleType<any> | IntegerType | LiteralType<any> | DateType;
const isDirectlyAssignableType = (type: IAnyType): type is DirectlyAssignableType =>
  type instanceof SimpleType || type instanceof IntegerType || type instanceof LiteralType || type instanceof DateType;

class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
  inputs = new Map<any, string>();

  constructor(readonly model: T) {}

  build(): CompiledInstantiator<T> {
    const segments: string[] = [];

    const buildSegment = (key: string, type: IAnyType) => {
      if (isDirectlyAssignableType(type)) {
        segments.push(`
        // simple type for ${key}
        instance["${key}"] = ${this.expressionForDirectlyAssignableType(key, type)};
      `);
      } else if (type instanceof OptionalType) {
        segments.push(this.assignmentExpressionForOptionalType(key, type));
      } else if (type instanceof ReferenceType || type instanceof SafeReferenceType) {
        segments.push(this.assignmentExpressionForReferenceType(key, type));
      } else if (type instanceof MapType) {
        segments.push(this.assignmentExpressionForMapType(key, type));
      } else if (type instanceof LateType) {
        const wrappedType = type.type;
        buildSegment(key, wrappedType);
      } else {
        segments.push(this.fallbackAssignmentExpression(key, type));
      }
    };

    for (const [key, type] of Object.entries(this.model.properties)) {
      buildSegment(key, type);
    }

    for (const [key, _metadata] of Object.entries(this.model.volatiles)) {
      segments.push(`
      instance["${key}"] = ${this.input(this.model.volatiles[key])}.initializer(instance);
    `);
    }

    const identifierProp = this.model.mstType.identifierAttribute;
    if (identifierProp) {
      segments.push(`
      const id = instance["${identifierProp}"];
      instance[${this.input($identifier, "$identifier")}] = id;
      context.referenceCache.set(id, instance); 
    `);
    }

    const innerFunc = `
      return function Instantiate${this.model.name}(instance, snapshot, context) {
        ${segments.join("\n")}
      }
    `;

    const inputEntries = Array.from(this.inputs.entries());
    const inputNames = inputEntries.map(([_value, name]) => name);
    const inputValues = inputEntries.map(([value, _name]) => value);

    const inputsWrapperFuncBody = `
    // define input variables for all input values in closure
    ${inputNames.map((name, index) => `const ${name} = imports.inputs[${index}];`).join("\n")}

    // define function
    ${innerFunc}
  `;

    // console.log(`function for ${this.model.name}`, "\n\n\n", inputsWrapperFuncBody, "\n\n\n");

    // build a function that closes over a bunch of aliased expressions
    // evaluate the inner function source code in this closure to return the function
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const aliasFunc = new Function("model", "imports", inputsWrapperFuncBody);

    // evaluate aliases and get created inner function
    return aliasFunc(this.model, { inputs: inputValues }) as CompiledInstantiator<T>;
  }

  private fallbackAssignmentExpression(key: string, type: IAnyType): string {
    return `
      // instantiate fallback for ${key} of type ${type.name}
      instance["${key}"] = ${this.input(type)}.instantiate(
        snapshot?.["${key}"], 
        context, 
        instance
      );
    `;
  }

  private assignmentExpressionForReferenceType(key: string, type: ReferenceType<IAnyType> | SafeReferenceType<IAnyType>): string {
    const varName = `identifier${key}`;
    let notFoundBehavior;
    if (type instanceof SafeReferenceType) {
      notFoundBehavior = `// safe reference, no error`;
    } else {
      notFoundBehavior = `throw new Error(\`can't resolve reference \${${varName}} for key "${key}"\`);`;
    }

    return `
      // setup reference for ${key}
      const ${varName} = snapshot?.["${key}"];
      context.referencesToResolve.push(() => {
        if (${varName}) {
          const referencedInstance = context.referenceCache.get(${varName});
          if (referencedInstance) {
            instance["${key}"] = referencedInstance;
            return;
          }
        }
        ${notFoundBehavior}
      });
    `;
  }

  private expressionForDirectlyAssignableType(key: string, type: DirectlyAssignableType) {
    if (type instanceof DateType) {
      return `new Date(snapshot?.["${key}"])`;
    } else {
      return `snapshot?.["${key}"]`;
    }
  }

  private assignmentExpressionForOptionalType(key: string, type: OptionalType<IAnyType, [ValidOptionalValue, ...ValidOptionalValue[]]>) {
    let defaultValueExpression;
    if (type.defaultValueOrFunc instanceof Function) {
      defaultValueExpression = `model.properties["${key}"].defaultValueOrFunc()`;
    } else {
      defaultValueExpression = JSON.stringify(type.defaultValueOrFunc);
    }

    const varName = `snapshotValue${key}`;

    const comparisonsToUndefinedValues = (type.undefinedValues ?? [undefined]).map((value) => {
      if (typeof value == "undefined") {
        return `(typeof ${varName} == "undefined")`;
      } else {
        return `(${varName} === ${JSON.stringify(value)})`;
      }
    });

    let createExpression;
    if (isDirectlyAssignableType(type.type)) {
      createExpression = `
      instance["${key}"] = ${varName}
      `;
    } else {
      createExpression = `
      instance["${key}"] = ${this.input(type.type)}.instantiate(
        ${varName}, 
        context, 
        instance
      );
      `;
    }

    return `
      // optional type for ${key}
      let ${varName} = snapshot?.["${key}"];
      if (${comparisonsToUndefinedValues.join(" || ")}) {
        ${varName} = ${defaultValueExpression}
      }
      ${createExpression}
    `;
  }

  private assignmentExpressionForMapType(key: string, type: MapType<any>): string {
    const mapVarName = `map${key}`;
    const snapshotVarName = `snapshotValue${key}`;
    return `
      const ${mapVarName} = new ${this.input(QuickMap, "QuickMap")}(${this.input(type)}, instance, context.env);
      instance["${key}"] = ${mapVarName};
      const ${snapshotVarName} = snapshot?.["${key}"];
      if (${snapshotVarName}) {
        for (const key in ${snapshotVarName}) {
          ${mapVarName}.set(
            key, 
            ${this.input(type.childrenType)}.instantiate(
              ${snapshotVarName}[key], 
              context, 
              ${mapVarName}
            )
          );
        }
      }`;
  }

  /** Input a variable to the compiled function from this outer context */
  private input(value: any, nameHint?: string): string {
    const existingName = this.inputs.get(value);
    if (existingName) return existingName;
    const name = `input${nameHint ?? this.inputs.size}`;
    this.inputs.set(value, name);
    return name;
  }
}

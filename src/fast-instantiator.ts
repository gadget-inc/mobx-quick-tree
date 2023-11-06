import { ArrayType, QuickArray } from "./array";
import { FrozenType } from "./frozen";
import { MapType, QuickMap } from "./map";
import { OptionalType } from "./optional";
import { ReferenceType, SafeReferenceType } from "./reference";
import { DateType, IntegerType, LiteralType, SimpleType } from "./simple";
import { $identifier } from "./symbols";
import type { IAnyClassModelType, IAnyType, IClassModelType, Instance, InstantiateContext, SnapshotIn, ValidOptionalValue } from "./types";

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
const isDirectlyAssignableType = (type: IAnyType): type is DirectlyAssignableType => {
  return (
    type instanceof SimpleType ||
    type instanceof LiteralType ||
    type instanceof DateType ||
    type instanceof FrozenType ||
    (type instanceof ArrayType && isDirectlyAssignableType(type.childrenType) && !(type.childrenType instanceof DateType)) ||
    type instanceof IntegerType
  );
};

class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
  aliases = new Map<string, string>();

  constructor(readonly model: T) {}

  build(): CompiledInstantiator<T> {
    const segments: string[] = [];

    for (const [key, type] of Object.entries(this.model.properties)) {
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
      } else {
        segments.push(`
          // instantiate fallback for ${key} of type ${type.name}
          instance["${key}"] = ${this.alias(`model.properties["${key}"]`)}.instantiate(
            snapshot?.["${key}"],
            context,
            instance
          );
        `);
      }
    }

    for (const [key, _metadata] of Object.entries(this.model.volatiles)) {
      segments.push(`
      instance["${key}"] = ${this.alias(`model.volatiles["${key}"]`)}.initializer(instance);
    `);
    }

    const identifierProp = this.model.mstType.identifierAttribute;
    if (identifierProp) {
      segments.push(`
      const id = instance["${identifierProp}"];
      instance[$identifier] = id;
      context.referenceCache.set(id, instance);
    `);
    }

    const innerFunc = `
      return function Instantiate${this.model.name}(instance, snapshot, context) {
        ${segments.join("\n")}
      }
    `;

    const aliasFuncBody = `
    const { QuickMap, QuickArray, $identifier } = imports;
    ${Array.from(this.aliases.entries())
      .map(([expression, alias]) => `const ${alias} = ${expression};`)
      .join("\n")}

    ${innerFunc}
  `;

    // console.log(`function for ${this.model.name}`, "\n\n\n", aliasFuncBody, "\n\n\n");

    // build a function that closes over a bunch of aliased expressions
    // evaluate the inner function source code in this closure to return the function
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const aliasFunc = new Function("model", "imports", aliasFuncBody);

    // evaluate aliases and get created inner function
    return aliasFunc(this.model, { $identifier, QuickMap, QuickArray }) as CompiledInstantiator<T>;
  }

  private expressionForDirectlyAssignableType(key: string, type: DirectlyAssignableType) {
    if (type instanceof DateType) {
      return `new Date(snapshot?.["${key}"])`;
    } else {
      return `snapshot?.["${key}"]`;
    }
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
      instance["${key}"] = ${this.alias(`model.properties["${key}"].type`)}.instantiate(
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

  private assignmentExpressionForArrayType(key: string, _type: MapType<any>): string {
    const mapVarName = `map${key}`;
    const snapshotVarName = `snapshotValue${key}`;
    return `
      const ${mapVarName} = new QuickArray(${this.alias(`model.properties["${key}"]`)}, instance, context.env);
      instance["${key}"] = ${mapVarName};
      const ${snapshotVarName} = snapshot?.["${key}"];
      if (${snapshotVarName}) {
        for (let index = 0; index < ${snapshotVarName}.length; ++index) {
          ${mapVarName}.push(
            ${this.alias(`model.properties["${key}"].childrenType`)}.instantiate(
              ${snapshotVarName}[index],
              context,
              ${mapVarName}
            )
          );
        }
      }`;
  }

  private assignmentExpressionForMapType(key: string, _type: MapType<any>): string {
    const mapVarName = `map${key}`;
    const snapshotVarName = `snapshotValue${key}`;
    return `
      const ${mapVarName} = new QuickMap(${this.alias(`model.properties["${key}"]`)}, instance, context.env);
      instance["${key}"] = ${mapVarName};
      const ${snapshotVarName} = snapshot?.["${key}"];
      if (${snapshotVarName}) {
        for (const key in ${snapshotVarName}) {
          ${mapVarName}.set(
            key,
            ${this.alias(`model.properties["${key}"].childrenType`)}.instantiate(
              ${snapshotVarName}[key],
              context,
              ${mapVarName}
            )
          );
        }
      }`;
  }

  alias(expression: string): string {
    const existing = this.aliases.get(expression);
    if (existing) {
      return existing;
    }

    const alias = `v${this.aliases.size}`;
    this.aliases.set(expression, alias);
    return alias;
  }
}

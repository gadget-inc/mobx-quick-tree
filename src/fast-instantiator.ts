import { OptionalType } from "./optional";
import { isReferenceType } from "./api";
import { LiteralType } from "./simple";
import { IntegerType, SimpleType } from "./simple";
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

type DirectlyAssignableType = SimpleType<any> | IntegerType | LiteralType<any>;
const isDirectlyAssignableType = (type: IAnyType): type is DirectlyAssignableType =>
  type instanceof SimpleType || type instanceof IntegerType || type instanceof LiteralType;

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
      } else if (isReferenceType(type.mstType)) {
        segments.push(`
        // setup reference for ${key}
        context.referencesToResolve.push(() => {
          instance["${key}"] = ${this.alias(`model.properties["${key}"]`)}.instantiate(
            snapshot?.["${key}"], 
            context, 
            instance
          );
        });
      `);
      } else {
        segments.push(`
          // instantiate fallback for ${key}
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
      instance[Symbol.for("MQT_identifier")] = id;
      context.referenceCache.set(id, instance); 
    `);
    }

    const innerFunc = `
      return function(instance, snapshot, context) {
        ${segments.join("\n")}
      }
    `;

    // build a function that closes over a bunch of aliased expressions
    // evaluate the inner function source code in this closure to return the function
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const aliasFunc = new Function(
      "model",
      "innerFunc",
      `
      ${Array.from(this.aliases.entries())
        .map(([expression, alias]) => `const ${alias} = ${expression};`)
        .join("\n")}

      ${innerFunc}
    `
    );

    // evaluate aliases and get created inner function
    const func = aliasFunc(this.model);
    // console.log(`function for ${this.model.name}`, "\n\n\n", func.toString(), "\n\n\n");
    return func;
  }

  expressionForDirectlyAssignableType(key: string, _type: DirectlyAssignableType) {
    return `snapshot?.["${key}"]`;
  }

  assignmentExpressionForOptionalType(key: string, type: OptionalType<IAnyType, [ValidOptionalValue, ...ValidOptionalValue[]]>) {
    let defaultValueExpression;
    if (type.defaultValueOrFunc instanceof Function) {
      defaultValueExpression = `model.properties["${key}"].defaultValueOrFunc()`;
    } else {
      defaultValueExpression = JSON.stringify(type.defaultValueOrFunc);
    }

    const varName = `snapshotValue${key}`;

    const comparisonsToUndefinedValues = (type.undefinedValues ?? [undefined]).map((value) => {
      return `(${varName} === ${JSON.stringify(value)})`;
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

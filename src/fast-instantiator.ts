import { ArrayType, QuickArray } from "./array";
import { FrozenType } from "./frozen";
import { MapType, QuickMap } from "./map";
import { OptionalType } from "./optional";
import { ReferenceType, SafeReferenceType } from "./reference";
import { DateType, IntegerType, LiteralType, SimpleType } from "./simple";
import { $env, $identifier, $memoizedKeys, $memos, $parent, $readOnly, $type } from "./symbols";
import type { IAnyType, IClassModelType, ValidOptionalValue } from "./types";

/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
export const buildFastInstantiator = <T extends IClassModelType<Record<string, IAnyType>, any, any>>(model: T): T => {
  return new InstantiatorBuilder(model).build();
};

type DirectlyAssignableType = SimpleType<any> | IntegerType | LiteralType<any> | DateType;
const isDirectlyAssignableType = (type: IAnyType): type is DirectlyAssignableType => {
  return (
    type instanceof SimpleType ||
    type instanceof LiteralType ||
    type instanceof DateType ||
    type instanceof FrozenType ||
    type instanceof IntegerType
  );
};

class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
  aliases = new Map<string, string>();

  constructor(readonly model: T) {}

  build(): T {
    const segments: string[] = [];

    for (const [key, type] of Object.entries(this.model.properties)) {
      if (isDirectlyAssignableType(type)) {
        segments.push(`
          // simple type for ${key}
          this["${key}"] = ${this.expressionForDirectlyAssignableType(key, type)};
      `);
      } else if (type instanceof OptionalType) {
        segments.push(this.assignmentExpressionForOptionalType(key, type));
      } else if (type instanceof ReferenceType || type instanceof SafeReferenceType) {
        segments.push(this.assignmentExpressionForReferenceType(key, type));
      } else if (type instanceof ArrayType) {
        segments.push(this.assignmentExpressionForArrayType(key, type));
      } else if (type instanceof MapType) {
        segments.push(this.assignmentExpressionForMapType(key, type));
      } else {
        segments.push(`
          // instantiate fallback for ${key} of type ${type.name}
          this["${key}"] = ${this.alias(`model.properties["${key}"]`)}.instantiate(
            snapshot?.["${key}"],
            context,
            this
          );
        `);
      }
    }

    for (const [key, _metadata] of Object.entries(this.model.volatiles)) {
      segments.push(`
      this["${key}"] = ${this.alias(`model.volatiles["${key}"]`)}.initializer(this);
    `);
    }

    const identifierProp = this.model.mstType.identifierAttribute;
    if (identifierProp) {
      segments.push(`
      const id = this["${identifierProp}"];
      this[$identifier] = id;
      context.referenceCache.set(id, this);
    `);
    }

    let className = this.model.name;
    if (!className || className.trim().length == 0) {
      className = "AnonymousModel";
    }

    const defineClassStatement = `
      return class ${className} extends model {
        [$memos] = null;
        [$memoizedKeys] = null;

        static createReadOnly = (snapshot, env) => {
          const context = {
            referenceCache: new Map(),
            referencesToResolve: [],
            env,
          };
      
          const instance = new ${className}(snapshot, context, null);
      
          for (const resolver of context.referencesToResolve) {
            resolver();
          }
      
          return instance;
        };

        static instantiate(snapshot, context, parent) { 
          return new ${className}(snapshot, context, parent);
        };
        
        static is(value) {
          return (value instanceof ${className}) || ${className}.mstType.is(value);
        };

        constructor(
          snapshot,
          context,
          parent,
          /** @hidden */ hackyPreventInitialization = false
        ) {
          super(null, null, null, true);

          if (hackyPreventInitialization) {
            return;
          }
        
          this[$env] = context.env;
          this[$parent] = parent;
        
          ${segments.join("\n")}
        }

        get [$readOnly]() {
          return true;
        }
      
        get [$type]() {
          return this.constructor;
        }
      }
    `;

    const aliasFuncBody = `
    const { QuickMap, QuickArray, $identifier, $env, $parent, $memos, $memoizedKeys, $readOnly, $type } = imports;

    ${Array.from(this.aliases.entries())
      .map(([expression, alias]) => `const ${alias} = ${expression};`)
      .join("\n")}

    ${defineClassStatement}
  `;

    // console.log(`function for ${this.model.name}`, "\n\n\n", aliasFuncBody, "\n\n\n");

    try {
      // build a function that closes over a bunch of aliased expressions
      // evaluate the inner function source code in this closure to return the function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const aliasFunc = new Function("model", "imports", aliasFuncBody);

      // evaluate aliases and get created inner function
      return aliasFunc(this.model, { $identifier, $env, $parent, $memos, $memoizedKeys, $readOnly, $type, QuickMap, QuickArray }) as T;
    } catch (e) {
      console.warn("failed to build fast instantiator for", this.model.name);
      console.warn("dynamic source code:", aliasFuncBody);
      throw e;
    }
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
            this["${key}"] = referencedInstance;
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
      this["${key}"] = ${varName}
      `;
    } else {
      createExpression = `
      this["${key}"] = ${this.alias(`model.properties["${key}"].type`)}.instantiate(
        ${varName},
        context,
        this
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

  private assignmentExpressionForArrayType(key: string, type: ArrayType<any>): string {
    if (!isDirectlyAssignableType(type.childrenType) || type.childrenType instanceof DateType) {
      return `
        // instantiate fallback for ${key} of type ${type.name}
        this["${key}"] = ${this.alias(`model.properties["${key}"]`)}.instantiate(
          snapshot?.["${key}"],
          context,
          this
        );
      `;
    }

    // Directly assignable types are primitives so we don't need to worry about setting parent/env/etc. Hence, we just
    // pass the snapshot straight through to the constructor.
    return `
      this["${key}"] = new QuickArray(
        ${this.alias(`model.properties["${key}"]`)},
        this,
        context.env,
        ...(snapshot?.["${key}"] ?? [])
      );
    `;
  }

  private assignmentExpressionForMapType(key: string, _type: MapType<any>): string {
    const mapVarName = `map${key}`;
    const snapshotVarName = `snapshotValue${key}`;
    return `
      const ${mapVarName} = new QuickMap(${this.alias(`model.properties["${key}"]`)}, this, context.env);
      this["${key}"] = ${mapVarName};
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

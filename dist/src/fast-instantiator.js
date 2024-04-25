"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFastInstantiator = void 0;
const array_1 = require("./array");
const frozen_1 = require("./frozen");
const map_1 = require("./map");
const optional_1 = require("./optional");
const reference_1 = require("./reference");
const simple_1 = require("./simple");
const symbols_1 = require("./symbols");
/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
const buildFastInstantiator = (model) => {
    return new InstantiatorBuilder(model).build();
};
exports.buildFastInstantiator = buildFastInstantiator;
const isDirectlyAssignableType = (type) => {
    return (type instanceof simple_1.SimpleType ||
        type instanceof simple_1.LiteralType ||
        type instanceof simple_1.DateType ||
        type instanceof frozen_1.FrozenType ||
        type instanceof simple_1.IntegerType);
};
class InstantiatorBuilder {
    constructor(model) {
        this.model = model;
        this.aliases = new Map();
    }
    build() {
        const segments = [];
        for (const [key, type] of Object.entries(this.model.properties)) {
            if (isDirectlyAssignableType(type)) {
                segments.push(`
          // simple type for ${key}
          this["${key}"] = ${this.expressionForDirectlyAssignableType(key, type)};
      `);
            }
            else if (type instanceof optional_1.OptionalType) {
                segments.push(this.assignmentExpressionForOptionalType(key, type));
            }
            else if (type instanceof reference_1.ReferenceType || type instanceof reference_1.SafeReferenceType) {
                segments.push(this.assignmentExpressionForReferenceType(key, type));
            }
            else if (type instanceof array_1.ArrayType) {
                segments.push(this.assignmentExpressionForArrayType(key, type));
            }
            else if (type instanceof map_1.MapType) {
                segments.push(this.assignmentExpressionForMapType(key, type));
            }
            else {
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

          this[$context] = context;
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
    const { QuickMap, QuickArray, $identifier, $context, $parent, $memos, $memoizedKeys, $readOnly, $type } = imports;

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
            const aliasFunc = eval(`
        (
          function buildFastInstantiator(model, imports) {
            ${aliasFuncBody}
          }
        )
        //# sourceURL=mqt-eval/dynamic/${className}.js
      `);
            // evaluate aliases and get created inner function
            return aliasFunc(this.model, {
                $identifier: symbols_1.$identifier,
                $context: symbols_1.$context,
                $parent: symbols_1.$parent,
                $memos: symbols_1.$memos,
                $memoizedKeys: symbols_1.$memoizedKeys,
                $readOnly: symbols_1.$readOnly,
                $type: symbols_1.$type,
                QuickMap: map_1.QuickMap,
                QuickArray: array_1.QuickArray,
            });
        }
        catch (e) {
            console.warn("failed to build fast instantiator for", this.model.name);
            console.warn("dynamic source code:", aliasFuncBody);
            throw e;
        }
    }
    expressionForDirectlyAssignableType(key, type, valueExpression = `snapshot?.["${key}"]`) {
        return type instanceof simple_1.DateType ? `new Date(${valueExpression})` : valueExpression;
    }
    assignmentExpressionForReferenceType(key, type) {
        const varName = `identifier${key}`;
        let notFoundBehavior;
        if (type instanceof reference_1.SafeReferenceType) {
            notFoundBehavior = `// safe reference, no error`;
        }
        else {
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
    assignmentExpressionForOptionalType(key, type) {
        let defaultValueExpression;
        if (type.defaultValueOrFunc instanceof Function) {
            defaultValueExpression = `model.properties["${key}"].defaultValueOrFunc()`;
        }
        else {
            defaultValueExpression = JSON.stringify(type.defaultValueOrFunc);
        }
        const varName = `snapshotValue${key}`;
        let createExpression;
        if (isDirectlyAssignableType(type.type)) {
            createExpression = `
      this["${key}"] = ${this.expressionForDirectlyAssignableType(key, type.type, varName)};
      `;
        }
        else {
            createExpression = `
      this["${key}"] = ${this.alias(`model.properties["${key}"].type`)}.instantiate(
        ${varName},
        context,
        this
      );
      `;
        }
        const comparisonsToUndefinedValues = (type.undefinedValues ?? [undefined]).map((value) => {
            if (typeof value == "undefined") {
                return `(typeof ${varName} == "undefined")`;
            }
            else {
                return `(${varName} === ${JSON.stringify(value)})`;
            }
        });
        return `
      // optional type for ${key}
      let ${varName} = snapshot?.["${key}"];
      if (${comparisonsToUndefinedValues.join(" || ")}) {
        ${varName} = ${defaultValueExpression}
      }
      ${createExpression}
    `;
    }
    assignmentExpressionForArrayType(key, type) {
        if (!isDirectlyAssignableType(type.childrenType) || type.childrenType instanceof simple_1.DateType) {
            return `
        // instantiate fallback for ${key} of type ${type.name.replace("\n", "")}
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
        context,
        ...(snapshot?.["${key}"] ?? [])
      );
    `;
    }
    assignmentExpressionForMapType(key, _type) {
        const mapVarName = `map${key}`;
        const snapshotVarName = `snapshotValue${key}`;
        return `
      const ${mapVarName} = new QuickMap(${this.alias(`model.properties["${key}"]`)}, this, context);
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
    alias(expression) {
        const existing = this.aliases.get(expression);
        if (existing) {
            return existing;
        }
        const alias = `v${this.aliases.size}`;
        this.aliases.set(expression, alias);
        return alias;
    }
}

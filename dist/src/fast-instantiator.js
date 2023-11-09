"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantiatorBuilder = void 0;
const array_1 = require("./array");
const frozen_1 = require("./frozen");
const map_1 = require("./map");
const optional_1 = require("./optional");
const reference_1 = require("./reference");
const simple_1 = require("./simple");
const symbols_1 = require("./symbols");
const isDirectlyAssignableType = (type) => {
    return (type instanceof simple_1.SimpleType ||
        type instanceof simple_1.LiteralType ||
        type instanceof simple_1.DateType ||
        type instanceof frozen_1.FrozenType ||
        type instanceof simple_1.IntegerType);
};
/**
 * Compiles a fast class constructor that takes snapshots and turns them into instances of a class model.
 **/
class InstantiatorBuilder {
    constructor(model, cachedViews) {
        this.model = model;
        this.cachedViews = cachedViews;
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
        for (const [index, cachedView] of this.cachedViews.entries()) {
            segments.push(this.assignCachedViewExpression(cachedView, index));
        }
        const identifierProp = this.model.mstType.identifierAttribute;
        if (identifierProp) {
            segments.push(`
      const id = this["${identifierProp}"];
      this[$identifier] = id;
      context.referenceCache.set(id, this);
    `);
        }
        const defineClassStatement = `
      return class ${this.model.name} extends model {
        [$memos] = null;
        [$memoizedKeys] = null;

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
    const { QuickMap, QuickArray, $identifier, $env, $parent, $memos, $memoizedKeys, $readOnly, $type, cachedViews } = imports;

    ${Array.from(this.aliases.entries())
            .map(([expression, alias]) => `const ${alias} = ${expression};`)
            .join("\n")}

    ${defineClassStatement}
  `;
        console.log(`function for ${this.model.name}`, "\n\n\n", aliasFuncBody, "\n\n\n");
        // build a function that closes over a bunch of aliased expressions
        // evaluate the inner function source code in this closure to return the function
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const aliasFunc = new Function("model", "imports", aliasFuncBody);
        // evaluate aliases and get created inner function
        return aliasFunc(this.model, {
            $identifier: symbols_1.$identifier,
            $env: symbols_1.$env,
            $parent: symbols_1.$parent,
            $memos: symbols_1.$memos,
            $memoizedKeys: symbols_1.$memoizedKeys,
            $readOnly: symbols_1.$readOnly,
            $type: symbols_1.$type,
            QuickMap: map_1.QuickMap,
            QuickArray: array_1.QuickArray,
            cachedViews: this.cachedViews,
        });
    }
    expressionForDirectlyAssignableType(key, type) {
        if (type instanceof simple_1.DateType) {
            return `new Date(snapshot?.["${key}"])`;
        }
        else {
            return `snapshot?.["${key}"]`;
        }
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
        const comparisonsToUndefinedValues = (type.undefinedValues ?? [undefined]).map((value) => {
            if (typeof value == "undefined") {
                return `(typeof ${varName} == "undefined")`;
            }
            else {
                return `(${varName} === ${JSON.stringify(value)})`;
            }
        });
        let createExpression;
        if (isDirectlyAssignableType(type.type)) {
            createExpression = `
      this["${key}"] = ${varName}
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
    assignmentExpressionForMapType(key, _type) {
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
    assignCachedViewExpression(cachedView, index) {
        const varName = `view${cachedView.property}`;
        let valueExpression = `snapshot?.["${cachedView.property}"]`;
        if (cachedView.cache.createReadOnly) {
            const alias = this.alias(`cachedViews[${index}].cache.createReadOnly`);
            valueExpression = `${alias}(${valueExpression}, snapshot)`;
        }
        return `
      // setup cached view for ${cachedView.property}
      const ${varName} = ${valueExpression};
      if (typeof ${varName} != "undefined") {
        this[$memoizedKeys] ??= {};
        this[$memos] ??= {};
        this[$memoizedKeys]["${cachedView.property}"] = true;
        this[$memos]["${cachedView.property}"] = ${varName};
      }
    `;
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
exports.InstantiatorBuilder = InstantiatorBuilder;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantiatorBuilder = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const array_1 = require("./array");
const frozen_1 = require("./frozen");
const map_1 = require("./map");
const maybe_1 = require("./maybe");
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
    constructor(model, getters) {
        this.model = model;
        this.getters = getters;
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
            else if ((0, mobx_state_tree_1.isReferenceType)(type.mstType)) {
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
          // instantiate fallback for ${key} of type ${safeTypeName(type)}
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
        const modelType = innerModelType(this.model.mstType);
        const identifierProp = modelType?.identifierAttribute;
        if (identifierProp) {
            segments.push(`
      const id = this["${identifierProp}"];
      this[$identifier] = id;
      context.referenceCache.set(id, this);
    `);
        }
        for (const snapshottedView of this.model.snapshottedViews) {
            segments.push(this.assignSnapshottedViewExpression(snapshottedView));
        }
        let className = this.model.name;
        if (!className || className.trim().length == 0) {
            className = "AnonymousModel";
        }
        const defineClassStatement = `
      class ${className} extends model {
        static createReadOnly = (snapshot, env) => {
          const context = {
            referenceCache: new Map(),
            referencesToResolve: [],
            env,
          };

          const instance = new ${className}(snapshot, context, null);

          // resolve any references that were deferred
          for (const { owner, identifier, property, required, instantiateUsing } of context.referencesToResolve) {
            if (instantiateUsing) {
              owner[property] = instantiateUsing.instantiate(identifier, context, owner);
            } else {
              const target = context.referenceCache.get(identifier);
              if (target) {
                owner[property] = target;
              } else if (required) {
                throw new Error(\`can't resolve reference for property "\${property}" using identifier \${identifier}\`);
              }
            }
          }

          context.referencesToResolve = null; // cleanup the list of references to resolve, no need to retain them past construction

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
    const { QuickMap, QuickArray, $identifier, $context, $parent, $notYetMemoized, $readOnly, $type, snapshottedViews } = imports;

    ${Array.from(this.aliases.entries())
            .map(([expression, alias]) => `const ${alias} = ${expression};`)
            .join("\n")}

    ${defineClassStatement}

    ${this.getters.outerClosureStatements(className)}

    return ${className}
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
                $readOnly: symbols_1.$readOnly,
                $type: symbols_1.$type,
                $notYetMemoized: symbols_1.$notYetMemoized,
                QuickMap: map_1.QuickMap,
                QuickArray: array_1.QuickArray,
                snapshottedViews: this.model.snapshottedViews,
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
        const identifierVarName = `identifier${key}`;
        const instanceVarName = `instance${key}`;
        let required;
        let instantiateUsing = null;
        if (type instanceof reference_1.SafeReferenceType ||
            ((type instanceof maybe_1.MaybeType || type instanceof maybe_1.MaybeNullType) &&
                (type.type instanceof reference_1.ReferenceType || type.type instanceof reference_1.SafeReferenceType))) {
            // we're resolving a safe reference, or a maybe/maybeNull of a reference. don't error if the reference can't be resolved
            required = false;
        }
        else if (type instanceof reference_1.ReferenceType) {
            // we're resolving a plain old reference -- error if the reference can't be resolved
            required = true;
        }
        else {
            // we're resolving a type that `isReferenceType` returns true for, but that we don't have a fastpath for, like a union of a model and a reference. fall back this type's instantiate call, but do it late in a context callback so that any reference elements of the union can be resolved
            required = false;
            instantiateUsing = this.alias(`model.properties["${key}"]`);
        }
        return `
      // setup reference for ${key}
      const ${identifierVarName} = snapshot?.["${key}"];

      // eager resolve path: check the reference cache immediately for the identifier
      const ${instanceVarName} = context.referenceCache.get(${identifierVarName});
      if (${instanceVarName}) {
        ${instantiateUsing ? `this["${key}"] = ${instantiateUsing}.instantiate(${identifierVarName}, context, this);` : `this["${key}"] = ${instanceVarName};`}
      } else {
        // late resolve path: add a descriptor to the context to resolve the reference later
        context.referencesToResolve.push({
          owner: this,
          identifier: ${identifierVarName},
          property: "${key}",
          required: ${required},
          instantiateUsing: ${instantiateUsing}
        });
      }
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
        // instantiate fallback for ${key} of type ${safeTypeName(type)}
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
    assignmentExpressionForMapType(key, type) {
        const mapVarName = `map${key}`;
        const snapshotVarName = `snapshotValue${key}`;
        const removeUndefineds = type.childrenType instanceof reference_1.SafeReferenceType && type.childrenType.options?.acceptsUndefined === false
            ? "if (item == null) { continue; }"
            : "";
        return `
      const ${mapVarName} = new QuickMap(${this.alias(`model.properties["${key}"]`)}, this, context);
      this["${key}"] = ${mapVarName};
      const ${snapshotVarName} = snapshot?.["${key}"];
      if (${snapshotVarName}) {
        for (const key in ${snapshotVarName}) {
          const item = ${this.alias(`model.properties["${key}"].childrenType`)}.instantiate(
            ${snapshotVarName}[key],
            context,
            ${mapVarName}
          );
          ${removeUndefineds}
          ${mapVarName}.set(key, item);
        }
      }`;
    }
    assignSnapshottedViewExpression(snapshottedView) {
        const varName = `view${snapshottedView.property}`;
        let destinationProp;
        if (snapshottedView.options.createReadOnly) {
            // we're using a hydrator, so we don't store it right at the memo, and instead stash it where we'll lazily hydrate it in the getter
            destinationProp = this.alias(`Symbol.for("${this.getters.snapshottedViewInputSymbolName(snapshottedView.property)}")`);
        }
        else {
            // we're not using a hydrator, so we can stash the snapshotted value right into the memoized spot
            destinationProp = this.alias(`Symbol.for("${this.getters.memoSymbolName(snapshottedView.property)}")`);
        }
        const valueExpression = `snapshot?.["${snapshottedView.property}"]`;
        return `
      // setup snapshotted view for ${snapshottedView.property}
      const ${varName} = ${valueExpression};
      if (typeof ${varName} != "undefined") {
        this[${destinationProp}] = ${varName};
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
const safeTypeName = (type) => type.name.replace(/\n/g, "");
const innerModelType = (type) => {
    if ("identifierAttribute" in type)
        return type;
    if ("getSubTypes" in type) {
        const subTypes = type.getSubTypes();
        if (subTypes) {
            if (Array.isArray(subTypes)) {
                return innerModelType(subTypes[0]);
            }
            else if (subTypes && typeof subTypes == "object") {
                return innerModelType(subTypes);
            }
        }
    }
};

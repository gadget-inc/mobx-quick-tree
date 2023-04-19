"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFastInstantiator = exports.$fastInstantiator = void 0;
const optional_1 = require("./optional");
const reference_1 = require("./reference");
const simple_1 = require("./simple");
const simple_2 = require("./simple");
const symbols_1 = require("./symbols");
const map_1 = require("./map");
exports.$fastInstantiator = Symbol.for("mqt:class-model-instantiator");
/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
const buildFastInstantiator = (model) => {
    return new InstantiatorBuilder(model).build();
};
exports.buildFastInstantiator = buildFastInstantiator;
const isDirectlyAssignableType = (type) => type instanceof simple_2.SimpleType || type instanceof simple_2.IntegerType || type instanceof simple_1.LiteralType || type instanceof simple_1.DateType;
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
        instance["${key}"] = ${this.expressionForDirectlyAssignableType(key, type)};
      `);
            }
            else if (type instanceof optional_1.OptionalType) {
                segments.push(this.assignmentExpressionForOptionalType(key, type));
            }
            else if (type instanceof reference_1.ReferenceType || type instanceof reference_1.SafeReferenceType) {
                segments.push(this.assignmentExpressionForReferenceType(key, type));
            }
            else if (type instanceof map_1.MapType) {
                segments.push(this.assignmentExpressionForMapType(key, type));
            }
            else {
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
    const { QuickMap, $identifier } = imports;
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
        return aliasFunc(this.model, { $identifier: symbols_1.$identifier, QuickMap: map_1.QuickMap });
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
            instance["${key}"] = referencedInstance;
            return;
          }
        }
        ${notFoundBehavior}
      });
    `;
    }
    expressionForDirectlyAssignableType(key, type) {
        if (type instanceof simple_1.DateType) {
            return `new Date(snapshot?.["${key}"])`;
        }
        else {
            return `snapshot?.["${key}"]`;
        }
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
            return `(${varName} === ${JSON.stringify(value)})`;
        });
        let createExpression;
        if (isDirectlyAssignableType(type.type)) {
            createExpression = `
      instance["${key}"] = ${varName}
      `;
        }
        else {
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
    assignmentExpressionForMapType(key, _type) {
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFastInstantiator = exports.$fastInstantiator = void 0;
const optional_1 = require("./optional");
const reference_1 = require("./reference");
const simple_1 = require("./simple");
const simple_2 = require("./simple");
const symbols_1 = require("./symbols");
const map_1 = require("./map");
const late_1 = require("./late");
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
        this.inputs = new Map();
    }
    build() {
        const segments = [];
        const buildSegment = (key, type) => {
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
            else if (type instanceof late_1.LateType) {
                const wrappedType = type.type;
                buildSegment(key, wrappedType);
            }
            else {
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
      instance[${this.input(symbols_1.$identifier, "$identifier")}] = id;
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
        return aliasFunc(this.model, { inputs: inputValues });
    }
    fallbackAssignmentExpression(key, type) {
        return `
      // instantiate fallback for ${key} of type ${type.name}
      instance["${key}"] = ${this.input(type)}.instantiate(
        snapshot?.["${key}"], 
        context, 
        instance
      );
    `;
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
      instance["${key}"] = ${varName}
      `;
        }
        else {
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
    assignmentExpressionForMapType(key, type) {
        const mapVarName = `map${key}`;
        const snapshotVarName = `snapshotValue${key}`;
        return `
      const ${mapVarName} = new ${this.input(map_1.QuickMap, "QuickMap")}(${this.input(type)}, instance, context.env);
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
    input(value, nameHint) {
        const existingName = this.inputs.get(value);
        if (existingName)
            return existingName;
        const name = `input${nameHint ?? this.inputs.size}`;
        this.inputs.set(value, name);
        return name;
    }
}

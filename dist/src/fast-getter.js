"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastGetBuilder = void 0;
const class_model_1 = require("./class-model");
const errors_1 = require("./errors");
const symbols_1 = require("./symbols");
/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
class FastGetBuilder {
    constructor(metadatas, klass) {
        this.klass = klass;
        this.memoizableProperties = metadatas
            .filter((metadata) => {
            if (metadata.type !== "view" && metadata.type !== "snapshotted-view")
                return false;
            const property = metadata.property;
            const descriptor = (0, class_model_1.getPropertyDescriptor)(klass.prototype, property);
            if (!descriptor) {
                throw new errors_1.RegistrationError(`Property ${property} not found on ${klass} prototype, can't register view for class model`);
            }
            return descriptor.get !== undefined;
        })
            .map((metadata) => metadata.property);
    }
    memoSymbolName(property) {
        return `mqt/${property}-memo`;
    }
    outerClosureStatements(className) {
        return this.memoizableProperties
            .map((property) => `
          const ${property}Memo = Symbol.for("${this.memoSymbolName(property)}");
          ${className}.prototype[${property}Memo] = $notYetMemoized;
        `)
            .join("\n");
    }
    buildGetter(property, descriptor) {
        const $memo = Symbol.for(this.memoSymbolName(property));
        const source = `
      (
        function build({ $readOnly, $memo, $notYetMemoized, getValue }) {
          return function get${property}(model, imports) {
            if (!this[$readOnly]) return getValue.call(this);
            let value = this[$memo];
            if (value !== $notYetMemoized) {
              return value;
            }

            value = getValue.call(this);
            this[$memo] = value;
            return value;
          }
        }
      )
      //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
    `;
        try {
            const builder = eval(source);
            return builder({ $readOnly: symbols_1.$readOnly, $memo, $notYetMemoized: symbols_1.$notYetMemoized, getValue: descriptor.get });
        }
        catch (error) {
            console.error(`Error building getter for ${this.klass.name}#${property}`);
            console.error(`Compiled source:\n${source}`);
            throw error;
        }
    }
}
exports.FastGetBuilder = FastGetBuilder;

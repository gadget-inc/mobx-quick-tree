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
    snapshottedViewInputSymbolName(property) {
        return `mqt/${property}-svi-memo`;
    }
    outerClosureStatements(className) {
        return this.memoizableProperties
            .map((property) => `
          const ${property}Memo = Symbol.for("${this.memoSymbolName(property)}");
          ${className}.prototype[${property}Memo] = $notYetMemoized;
        `)
            .join("\n");
    }
    buildViewGetter(metadata, descriptor) {
        const property = metadata.property;
        const $memo = Symbol.for(this.memoSymbolName(property));
        let source;
        let args;
        if (metadata.type === "snapshotted-view" && metadata.options.createReadOnly) {
            const $snapshotValue = Symbol.for(this.snapshottedViewInputSymbolName(property));
            // this snapshotted view has a hydrator, so we need a special view function for readonly instances that lazily hydrates the snapshotted value
            source = `
        (
          function build({ $readOnly, $memo, $notYetMemoized, $snapshotValue, getValue, hydrate }) {
            return function get${property}(model, imports) {
              if (!this[$readOnly]) return getValue.call(this);
              let value = this[$memo];
              if (value !== $notYetMemoized) {
                return value;
              }

              const dehydratedValue = this[$snapshotValue];
              if (typeof dehydratedValue !== "undefined") {
                value = hydrate(dehydratedValue, this);
              } else {
                value = getValue.call(this);
              }

              this[$memo] = value;
              return value;
            }
          }
        )
        //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
      `;
            args = { $readOnly: symbols_1.$readOnly, $memo, $snapshotValue, $notYetMemoized: symbols_1.$notYetMemoized, hydrate: metadata.options.createReadOnly, getValue: descriptor.get };
        }
        else {
            source = `
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
            args = { $readOnly: symbols_1.$readOnly, $memo, $notYetMemoized: symbols_1.$notYetMemoized, getValue: descriptor.get };
        }
        try {
            const builder = eval(source);
            return builder(args);
        }
        catch (error) {
            console.error(`Error building getter for ${this.klass.name}#${property}`);
            console.error(`Compiled source:\n${source}`);
            throw error;
        }
    }
}
exports.FastGetBuilder = FastGetBuilder;

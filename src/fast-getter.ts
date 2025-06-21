import type { PropertyMetadata, SnapshottedViewMetadata, ViewMetadata } from "./class-model";
import { getPropertyDescriptor } from "./class-model";
import { RegistrationError } from "./errors";
import { $readOnly } from "./symbols";

/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
export class FastGetBuilder {
  memoizableProperties: string[];

  constructor(
    metadatas: PropertyMetadata[],
    readonly klass: { new (...args: any[]): any },
  ) {
    this.memoizableProperties = metadatas
      .filter((metadata): metadata is ViewMetadata => {
        if (metadata.type !== "view" && metadata.type !== "snapshotted-view") return false;
        const property = metadata.property;
        const descriptor = getPropertyDescriptor(klass.prototype, property);
        if (!descriptor) {
          throw new RegistrationError(`Property ${property} not found on ${klass} prototype, can't register view for class model`);
        }
        return descriptor.get !== undefined;
      })
      .map((metadata) => metadata.property);
  }

  memoSymbolName(property: string) {
    return `mqt/${property}-memo`;
  }

  snapshottedViewInputSymbolName(property: string) {
    return `mqt/${property}-svi-memo`;
  }

  outerClosureStatements(className: string) {
    return "";
  }

  buildViewGetter(metadata: ViewMetadata | SnapshottedViewMetadata, descriptor: PropertyDescriptor) {
    const property = metadata.property;
    const $memo = Symbol.for(this.memoSymbolName(property));

    let source;
    let args;

    if (metadata.type === "snapshotted-view" && metadata.options.createReadOnly) {
      const $snapshotValue = Symbol.for(this.snapshottedViewInputSymbolName(property));

      // this snapshotted view has a hydrator, so we need a special view function for readonly instances that lazily hydrates the snapshotted value
      source = `
        (
          function build({ $readOnly, $memo, $snapshotValue, getValue, hydrate }) {
            return function get${property}() {
              if (!this[$readOnly]) return getValue.call(this);
              if ($memo in this) {
                return this[$memo];
              }

              const dehydratedValue = this[$snapshotValue];
              let value;
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
      args = { $readOnly, $memo, $snapshotValue, hydrate: metadata.options.createReadOnly, getValue: descriptor.get };
    } else {
      source = `
        (
          function build({ $readOnly, $memo, getValue }) {
            return function get${property}() {
              if (!this[$readOnly]) return getValue.call(this);
              if ($memo in this) {
                return this[$memo];
              }

              const value = getValue.call(this);
              this[$memo] = value;
              return value;
            }
          }
        )
        //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
      `;
      args = { $readOnly, $memo, getValue: descriptor.get };
    }

    try {
      const builder = eval(source);
      return builder(args);
    } catch (error) {
      console.error(`Error building getter for ${this.klass.name}#${property}`);
      console.error(`Compiled source:\n${source}`);
      throw error;
    }
  }
}

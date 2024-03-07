import type { PropertyMetadata, ViewMetadata } from "./class-model";
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
        if (metadata.type !== "view") return false;
        const property = metadata.property;
        const descriptor = getPropertyDescriptor(klass.prototype, property);
        if (!descriptor) {
          throw new RegistrationError(`Property ${property} not found on ${klass} prototype, can't register view for class model`);
        }
        return descriptor.get !== undefined;
      })
      .map((metadata) => metadata.property);
  }

  buildGetter(property: string, descriptor: PropertyDescriptor) {
    const builder = eval(`
    (
      function build({ $readOnly, getValue }) {
        return function get${property}(model, imports) {
          if (!this[$readOnly]) return getValue.call(this);
          const value = getValue.call(this);
          Object.defineProperty(this, "${property}", { value, writable: false })
          return value;
        }
      }
    )
    //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
  `);

    return builder({ $readOnly, getValue: descriptor.get });
  }
}

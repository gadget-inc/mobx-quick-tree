import type { PropertyMetadata, ViewMetadata } from "./class-model";
import { getPropertyDescriptor } from "./class-model";
import { RegistrationError } from "./errors";
import { $memos, $notYetMemoized, $readOnly } from "./symbols";

/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */

export class FastGetBuilder {
  memoizableProperties: string[];
  memosClass: { new (...args: any[]): any };

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

    this.memosClass = class {};
    for (const property of this.memoizableProperties) {
      this.memosClass.prototype[property] = $notYetMemoized;
    }
  }

  constructorStatements() {
    return `
      this[$memos] = null;
    `;
  }

  buildGetter(property: string, descriptor: PropertyDescriptor) {
    const source = `
      (
        function build({ $readOnly, $memos, $notYetMemoized, getValue, MemosClass }) {
          return function get${property}(model, imports) {
            if (!this[$readOnly]) return getValue.call(this);
            if (!this[$memos]) {
              this[$memos] = new MemosClass();
            }

            let value = this[$memos].${property};
            if (value != $notYetMemoized) {
              return value;
            }

            value = getValue.call(this);
            this[$memos].${property} = value;
            return value;
          }
        }
      )
      //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
    `;

    try {
      const builder = eval(source);
      return builder({ $readOnly, $memos, $notYetMemoized, MemosClass: this.memosClass, getValue: descriptor.get });
    } catch (error) {
      console.error(`Error building getter for ${this.klass.name}#${property}`);
      console.error(`Compiled source:\n${source}`);
      throw error;
    }
  }
}

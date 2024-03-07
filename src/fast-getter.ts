import type { PropertyMetadata, ViewMetadata } from "./class-model";
import { getPropertyDescriptor } from "./class-model";
import { RegistrationError } from "./errors";
import { $notYetMemoized, $readOnly } from "./symbols";

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

  outerClosureStatements(className: string) {
    return this.memoizableProperties
      .map(
        (property) => `
          const ${property}Memo = Symbol.for("mqt/${property}-memo");
          ${className}.prototype[${property}Memo] = $notYetMemoized;
        `,
      )
      .join("\n");
  }

  buildGetter(property: string, descriptor: PropertyDescriptor) {
    const $memo = Symbol.for(`mqt/${property}-memo`);
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
      return builder({ $readOnly, $memo, $notYetMemoized, getValue: descriptor.get });
    } catch (error) {
      console.error(`Error building getter for ${this.klass.name}#${property}`);
      console.error(`Compiled source:\n${source}`);
      throw error;
    }
  }
}

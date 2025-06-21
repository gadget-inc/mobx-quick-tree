import { snapshotProcessor } from "mobx-state-tree/dist/internal";
import type { PropertyMetadata, SnapshottedViewMetadata, ViewMetadata } from "./class-model";
import { getPropertyDescriptor } from "./class-model";
import { RegistrationError } from "./errors";
import { $notYetMemoized, $readOnly } from "./symbols";

/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
export class FastGetBuilder {
  memoizableProperties: string[];
  private symbolCache: Map<string, symbol> = new Map();

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

  getMemoSymbol(property: string): symbol {
    const key = `memo-${property}`;
    if (!this.symbolCache.has(key)) {
      this.symbolCache.set(key, Symbol.for(this.memoSymbolName(property)));
    }
    return this.symbolCache.get(key)!;
  }

  getSnapshottedViewInputSymbol(property: string): symbol {
    const key = `svi-${property}`;
    if (!this.symbolCache.has(key)) {
      this.symbolCache.set(key, Symbol.for(this.snapshottedViewInputSymbolName(property)));
    }
    return this.symbolCache.get(key)!;
  }

  outerClosureStatements(className: string) {
    return this.memoizableProperties
      .map(
        (property) => `
          const ${property}Memo = Symbol.for("${this.memoSymbolName(property)}");
          ${className}.prototype[${property}Memo] = $notYetMemoized;
        `,
      )
      .join("\n");
  }

  buildViewGetter(metadata: ViewMetadata | SnapshottedViewMetadata, descriptor: PropertyDescriptor) {
    const property = metadata.property;
    const $memo = this.getMemoSymbol(property);

    let source;
    let args;

    if (metadata.type === "snapshotted-view" && metadata.options.createReadOnly) {
      const $snapshotValue = this.getSnapshottedViewInputSymbol(property);

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
      args = { $readOnly, $memo, $snapshotValue, $notYetMemoized, hydrate: metadata.options.createReadOnly, getValue: descriptor.get };
    } else {
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
      args = { $readOnly, $memo, $notYetMemoized, getValue: descriptor.get };
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

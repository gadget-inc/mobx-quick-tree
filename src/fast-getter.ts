import { snapshotProcessor } from "mobx-state-tree/dist/internal";
import type { PropertyMetadata, SnapshottedViewMetadata, ViewMetadata } from "./class-model";
import { getPropertyDescriptor } from "./class-model";
import { RegistrationError } from "./errors";
import { $notYetMemoized, $readOnly } from "./symbols";

/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
export class FastGetBuilder {
  memoizableProperties: string[];
  snapshottedViewProperties: string[];

  constructor(
    metadatas: PropertyMetadata[],
    readonly klass: { new (...args: any[]): any },
  ) {
    const viewMetadatas = metadatas.filter((metadata): metadata is ViewMetadata | SnapshottedViewMetadata => {
      if (metadata.type !== "view" && metadata.type !== "snapshotted-view") return false;
      const property = metadata.property;
      const descriptor = getPropertyDescriptor(klass.prototype, property);
      if (!descriptor) {
        throw new RegistrationError(`Property ${property} not found on ${klass} prototype, can't register view for class model`);
      }
      return descriptor.get !== undefined;
    });
    
    this.memoizableProperties = viewMetadatas.map((metadata) => metadata.property);
    this.snapshottedViewProperties = viewMetadatas
      .filter((metadata): metadata is SnapshottedViewMetadata => metadata.type === "snapshotted-view" && !!metadata.options.createReadOnly)
      .map((metadata) => metadata.property);
  }

  outerClosureStatements(className: string) {
    const memoStatements = this.memoizableProperties
      .map(
        (property) => `
          ${className}.prototype._${property}_memo = $notYetMemoized;
        `,
      );
    
    const snapshotStatements = this.snapshottedViewProperties
      .map(
        (property) => `
          ${className}.prototype._${property}_snapshot = undefined;
        `,
      );
    
    return [...memoStatements, ...snapshotStatements].join("\n");
  }

  buildViewGetter(metadata: ViewMetadata | SnapshottedViewMetadata, descriptor: PropertyDescriptor) {
    const property = metadata.property;

    let source;
    let args;

    if (metadata.type === "snapshotted-view" && metadata.options.createReadOnly) {
      // this snapshotted view has a hydrator, so we need a special view function for readonly instances that lazily hydrates the snapshotted value
      source = `
        (
          function build({ $readOnly, $notYetMemoized, getValue, hydrate }) {
            return function get${property}(model, imports) {
              if (!this[$readOnly]) return getValue.call(this);
              let value = this._${property}_memo;
              if (value !== $notYetMemoized) {
                return value;
              }

              const dehydratedValue = this._${property}_snapshot;
              if (typeof dehydratedValue !== "undefined") {
                value = hydrate(dehydratedValue, this);
              } else {
                value = getValue.call(this);
              }

              this._${property}_memo = value;
              return value;
            }
          }
        )
        //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
      `;
      args = { $readOnly, $notYetMemoized, hydrate: metadata.options.createReadOnly, getValue: descriptor.get };
    } else {
      source = `
        (
          function build({ $readOnly, $notYetMemoized, getValue }) {
            return function get${property}(model, imports) {
              if (!this[$readOnly]) return getValue.call(this);
              let value = this._${property}_memo;
              if (value !== $notYetMemoized) {
                return value;
              }

              value = getValue.call(this);
              this._${property}_memo = value;
              return value;
            }
          }
        )
        //# sourceURL=mqt-eval/dynamic/${this.klass.name}-${property}-get.js
      `;
      args = { $readOnly, $notYetMemoized, getValue: descriptor.get };
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

import type { IAnyType as AnyMSTType, Instance } from "mobx-state-tree";
import { $parent, $quickType, $type } from "./symbols";
import type { IAnyComplexType, IAnyType, QuickOrMSTInstance, StateTreeNode } from "./types";

/** @hidden */
export interface InstantiateContext {
  referenceCache: StateTreeNode<Record<string, object>, IAnyComplexType>;
  referencesToResolve: (() => void)[];
}

export abstract class BaseType<InputType, OutputType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;
  readonly InputType!: InputType;
  readonly OutputType!: OutputType;
  readonly InstanceType!: StateTreeNode<OutputType, this>;

  constructor(readonly name: string, readonly mstType: MSTType) {
    Reflect.defineProperty(this, "mstType", {
      value: mstType,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  create(snapshot?: this["InputType"], env?: any): Instance<MSTType> {
    return this.mstType.create(snapshot, env);
  }

  is(value: any): value is QuickOrMSTInstance<this> {
    return this.mstType.is(value);
  }

  createReadOnly(snapshot?: InputType): OutputType {
    const context: InstantiateContext = {
      referenceCache: {},
      referencesToResolve: [],
    };

    const instance = this.instantiate(snapshot, context);
    for (const resolver of context.referencesToResolve) {
      resolver();
    }
    return instance;
  }

  abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["OutputType"];
}

/** @hidden */
export const setType = (value: unknown, type: IAnyType) => {
  if (value && typeof value == "object") {
    Reflect.defineProperty(value, $type, {
      value: type,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

/** @hidden */
export const setParent = (value: unknown, parent: any) => {
  if (value && typeof value == "object") {
    Reflect.defineProperty(value, $parent, {
      value: parent,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

import { IAnyComplexType as AnyComplexMSTType, IAnyType as AnyMSTType, Instance } from "mobx-state-tree";
import { $parent, $quickType, $type } from "./symbols";

/** @hidden */
export interface InstantiateContext {
  referenceCache: Record<string, object>;
  referencesToResolve: (() => void)[];
}

export abstract class BaseType<InputType, InstanceType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;
  readonly InputType!: InputType;
  readonly InstanceType!: InstanceType;

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

  createReadOnly(snapshot?: InputType): InstanceType {
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

  abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}

export type IAnyType = BaseType<any, any, AnyMSTType>;
export type IAnyComplexType = BaseType<any, any, AnyComplexMSTType>;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | Instance<T["mstType"]>;

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

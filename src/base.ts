import { IAnyType as AnyMSTType, Instance } from "mobx-state-tree";
import { $parent, $quickType, $type } from "./symbols";

export abstract class BaseType<InputType, InstanceType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;
  readonly InputType: InputType;
  readonly InstanceType: InstanceType;

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

  abstract createReadOnly(snapshot?: InputType): InstanceType;
}

export type IAnyType = BaseType<any, any, any>;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | Instance<T["mstType"]>;

/** @hidden */
export const setType = (value: unknown, type: IAnyType) => {
  if (typeof value == "object") {
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
  if (typeof value == "object") {
    Reflect.defineProperty(value, $parent, {
      value: parent,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

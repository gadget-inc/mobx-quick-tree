import { types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import type { CreateTypes, IAnyStateTreeNode, IAnyType, InstantiateContext, IOptionalType, ValidOptionalValue } from "./types";

export type DefaultFuncOrValue<T extends IAnyType> = T["InputType"] | T["OutputType"] | (() => CreateTypes<T>);

class OptionalType<T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]> extends BaseType<
  T["InputType"] | OptionalValues[number],
  T["OutputType"],
  T["InstanceTypeWithoutSTN"]
> {
  constructor(
    readonly type: T,
    private readonly defaultValueOrFunc: DefaultFuncOrValue<T>,
    private readonly undefinedValues?: OptionalValues
  ) {
    super(
      undefinedValues
        ? mstTypes.optional(type.mstType, defaultValueOrFunc, undefinedValues)
        : mstTypes.optional(type.mstType, defaultValueOrFunc)
    );
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    if (this.undefinedValues) {
      if (this.undefinedValues.includes(snapshot)) {
        snapshot = this.defaultValue;
      }
    } else if (snapshot === undefined) {
      snapshot = this.defaultValue;
    }

    return this.type.instantiate(snapshot, context);
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (this.undefinedValues) {
      if (this.undefinedValues.includes(value)) {
        return true;
      }
    } else if (value === undefined) {
      return true;
    }

    return this.type.is(value);
  }

  private get defaultValue(): T["InputType"] {
    return this.defaultValueOrFunc instanceof Function ? this.defaultValueOrFunc() : this.defaultValueOrFunc;
  }
}

export type OptionalFactory = {
  <T extends IAnyType>(type: T, defaultValue: DefaultFuncOrValue<T>): IOptionalType<T, [undefined]>;
  <T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]>(
    type: T,
    defaultValue: DefaultFuncOrValue<T>,
    undefinedValues: OptionalValues
  ): IOptionalType<T, OptionalValues>;
};

export const optional: OptionalFactory = <T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]>(
  type: T,
  defaultValue: DefaultFuncOrValue<T>,
  undefinedValues?: OptionalValues
): IOptionalType<T, OptionalValues> => {
  return new OptionalType(type, defaultValue, undefinedValues);
};

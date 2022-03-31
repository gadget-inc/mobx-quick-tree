import { BaseType } from "./base";
import type { FuncOrValue, IAnyType, InstantiateContext, IOptionalType, ValidOptionalValue } from "./types";

export class OptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> extends BaseType<
  T["InputType"] | OptionalValues[number],
  T["OutputType"],
  T["InstanceType"],
  T["mstType"]
> {
  constructor(
    readonly type: T,
    private readonly defaultValueOrFunc: FuncOrValue<T["InputType"]>,
    private readonly undefinedValues?: OptionalValues
  ) {
    super(`optional<${type.name}>`, type.mstType);
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

  private get defaultValue(): T["InputType"] {
    return this.defaultValueOrFunc instanceof Function ? this.defaultValueOrFunc() : this.defaultValueOrFunc;
  }
}

export type OptionalFactory = {
  <T extends IAnyType>(type: T, defaultValue: FuncOrValue<T["InputType"]>): IOptionalType<T, [undefined]>;

  <T extends IAnyType, OptionalValues extends ValidOptionalValue[]>(
    type: T,
    defaultValue: FuncOrValue<T["InputType"]>,
    undefinedValues: OptionalValues
  ): IOptionalType<T, OptionalValues>;
};

export const optional: OptionalFactory = <T extends IAnyType, OptionalValues extends ValidOptionalValue[]>(
  type: T,
  defaultValue: FuncOrValue<T["InputType"]>,
  undefinedValues?: OptionalValues
): OptionalType<T, OptionalValues> => {
  return new OptionalType(type, defaultValue, undefinedValues);
};

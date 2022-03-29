import { BaseType, IAnyType, InstantiateContext } from "./base";

export type ValidOptionalValue = string | boolean | number | null | undefined;

export type FuncOrValue<T> = T | (() => T);

export class OptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> extends BaseType<
  T["InputType"] | OptionalValues[number],
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

export const optional = <T extends IAnyType, OptionalValues extends ValidOptionalValue[]>(
  type: T,
  defaultValue: FuncOrValue<T["InputType"]>,
  undefinedValues?: OptionalValues
): OptionalType<T, OptionalValues> => {
  if (typeof defaultValue === "function") {
    defaultValue;
  }
  return new OptionalType(type, defaultValue, undefinedValues);
};

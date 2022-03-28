import { BaseType, IAnyType } from "./base";

export type ValidOptionalValue = string | boolean | number | null | undefined;

export class OptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> extends BaseType<
  T["InputType"] | OptionalValues[number],
  T["InstanceType"],
  T["mstType"]
> {
  constructor(readonly type: T, readonly defaultValue: T["InputType"], readonly undefinedValues?: OptionalValues) {
    super(`optional<${type.name}>`, type.mstType);
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (this.undefinedValues) {
      if (this.undefinedValues.includes(snapshot)) {
        snapshot = this.defaultValue;
      }
    } else if (snapshot === undefined) {
      snapshot = this.defaultValue;
    }

    return this.type.createReadOnly(snapshot);
  }
}

export const optional = <T extends BaseType<any, any, any>, OptionalValues extends ValidOptionalValue[]>(
  type: T,
  defaultValue: T["InputType"],
  undefinedValues?: OptionalValues
): OptionalType<T, OptionalValues> => {
  return new OptionalType(type, defaultValue, undefinedValues);
};

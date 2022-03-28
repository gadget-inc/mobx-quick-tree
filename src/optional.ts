import { BaseType } from "./base";

export type ValidOptionalValue = string | boolean | number | null | undefined;
export type ValidOptionalValues = [ValidOptionalValue, ...ValidOptionalValue[]];

export class OptionalType<T extends BaseType<any, any, any>> extends BaseType<
  T["InputType"],
  T["InstanceType"],
  T["mstType"]
> {
  constructor(readonly type: T, readonly defaultValue: T["InputType"], readonly undefinedValues?: ValidOptionalValues) {
    super(`optional<${type.name}>`, type.mstType);
  }

  createReadOnly(snapshot?: T["InputType"]): T["InstanceType"] {
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

export const optional = <T extends BaseType<any, any, any>>(
  type: T,
  defaultValue: T["InputType"],
  undefinedValues?: ValidOptionalValues
): BaseType<T["InputType"], T["InstanceType"], T["mstType"]> => {
  return new OptionalType(type, defaultValue, undefinedValues);
};

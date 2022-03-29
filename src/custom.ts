import { CustomTypeOptions, IType, types } from "mobx-state-tree";
import { BaseType } from "./base";

export type Primitives = string | number | boolean | Date | null | undefined;

export class CustomType<InputType, InstanceType> extends BaseType<
  InputType,
  InstanceType,
  IType<InputType | InstanceType, InputType, InstanceType>
> {
  constructor(readonly options: CustomTypeOptions<InputType, InstanceType>) {
    super(options.name, types.custom<InputType, InstanceType>(options));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error("can't initialize custom type with undefined");
    }
    return this.options.fromSnapshot(snapshot);
  }
}

export const custom = <InputType, InstanceType>(
  options: CustomTypeOptions<InputType, InstanceType>
): CustomType<InputType, InstanceType> => {
  return new CustomType(options);
};
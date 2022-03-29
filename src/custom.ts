import { CustomTypeOptions, IType, types } from "mobx-state-tree";
import { BaseType, InstantiateContext } from "./base";

export class CustomType<InputType, InstanceType> extends BaseType<
  InputType,
  InstanceType,
  IType<InputType | InstanceType, InputType, InstanceType>
> {
  constructor(readonly options: CustomTypeOptions<InputType, InstanceType>) {
    super(options.name, types.custom<InputType, InstanceType>(options));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
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

import { CustomTypeOptions, IType, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext } from "./types";

export class CustomType<InputType, InstanceType> extends BaseType<
  InputType,
  InstanceType,
  IType<InputType | InstanceType, InputType, InstanceType>
> {
  constructor(readonly options: CustomTypeOptions<InputType, InstanceType>) {
    super(options.name, types.custom<InputType, InstanceType>(options));
  }

  instantiate(snapshot: InputType, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error("can't initialize custom type with undefined");
    }

    // TODO figure out how to avoid the cast, maybe need to also consider setting $parent, etc
    return this.options.fromSnapshot(snapshot) as this["InstanceType"];
  }
}

export const custom = <InputType, InstanceType>(
  options: CustomTypeOptions<InputType, InstanceType>
): CustomType<InputType, InstanceType> => {
  return new CustomType(options);
};

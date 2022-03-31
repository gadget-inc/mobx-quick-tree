import { CustomTypeOptions, IType, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext } from "./types";

export class CustomType<InputType, OutputType> extends BaseType<
  InputType,
  OutputType,
  IType<InputType | OutputType, InputType, OutputType>
> {
  constructor(readonly options: CustomTypeOptions<InputType, OutputType>) {
    super(options.name, types.custom<InputType, OutputType>(options));
  }

  instantiate(snapshot: this["InputType"], _context: InstantiateContext): this["OutputType"] {
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

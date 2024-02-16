import type { CustomTypeOptions } from "mobx-state-tree";
import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IStateTreeNode, IType, TreeContext } from "./types";

export class CustomType<InputType, OutputType> extends BaseType<InputType, OutputType, OutputType> {
  constructor(readonly options: CustomTypeOptions<InputType, OutputType>) {
    super(types.custom<InputType, OutputType>(options));
  }

  instantiate(snapshot: InputType, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error("can't initialize custom type with undefined");
    }
    return this.options.fromSnapshot(snapshot) as this["InstanceType"];
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.mstType.is(value);
  }

  async schemaHash() {
    return `custom:${this.options.name}`;
  }
}

export const custom = <InputType, OutputType>(
  options: CustomTypeOptions<InputType, OutputType>
): IType<InputType, OutputType, OutputType> => {
  return new CustomType(options);
};

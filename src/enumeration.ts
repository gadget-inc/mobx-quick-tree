import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyStateTreeNode, InstantiateContext, ISimpleType } from "./types";

class EnumerationType<EnumOptions extends string> extends BaseType<EnumOptions, EnumOptions, EnumOptions> {
  constructor(readonly name: string, readonly options: EnumOptions[]) {
    super(types.enumeration<EnumOptions>(options));
  }

  instantiate(snapshot: this["InputType"], _context: InstantiateContext): this["InstanceType"] {
    if (typeof snapshot == "string" && this.options.includes(snapshot)) {
      return snapshot as this["InstanceType"];
    }
    throw new Error("unknown enum value");
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.options.includes(value);
  }
}

type EnumerationFactory = {
  <EnumOptions extends string>(name: string, options: EnumOptions[]): ISimpleType<EnumOptions>;
  <EnumOptions extends string>(options: EnumOptions[]): ISimpleType<EnumOptions>;
};

export const enumeration: EnumerationFactory = <EnumOptions extends string>(
  nameOrOptions: EnumOptions[] | string,
  options?: EnumOptions[]
): ISimpleType<EnumOptions> => {
  let name;
  if (typeof nameOrOptions == "string") {
    name = nameOrOptions;
    options ??= [];
  } else {
    name = "enumeration";
    options = nameOrOptions;
  }
  return new EnumerationType(name, options);
};

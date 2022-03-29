import { ISimpleType, types, UnionStringArray } from "mobx-state-tree";
import { BaseType } from "./base";

export class EnumerationType<EnumOptions extends string> extends BaseType<
  EnumOptions,
  EnumOptions,
  ISimpleType<UnionStringArray<EnumOptions[]>>
> {
  constructor(readonly name: string, readonly options: EnumOptions[]) {
    super(name, types.enumeration<EnumOptions>(options));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (typeof snapshot == "string" && this.options.includes(snapshot)) {
      return snapshot;
    }
    throw new Error("unknown enum value");
  }
}

type EnumerationFactory = {
  <EnumOptions extends string>(name: string, options: EnumOptions[]): EnumerationType<EnumOptions>;
  <EnumOptions extends string>(options: EnumOptions[]): EnumerationType<EnumOptions>;
};

export const enumeration: EnumerationFactory = <EnumOptions extends string>(
  nameOrOptions: EnumOptions[] | string,
  options?: EnumOptions[]
): EnumerationType<EnumOptions> => {
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
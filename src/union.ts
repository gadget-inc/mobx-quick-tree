import { types as mstTypes, UnionOptions } from "mobx-state-tree";
import { BaseType, IAnyType } from "./base";
import { literal } from "./simple";

export class UnionType<Types extends IAnyType[]> extends BaseType<
  Types[number]["InputType"],
  Types[number]["InstanceType"],
  Types[number]["mstType"]
> {
  constructor(private types: Types, readonly options?: UnionOptions) {
    super(
      "union",
      options ? mstTypes.union(options, ...types.map((x) => x.mstType)) : mstTypes.union(...types.map((x) => x.mstType))
    );
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const type = this.types.find((ty) => ty.is(snapshot));
    if (!type) {
      throw new Error("couldn't find valid type from union for given snapshot");
    }
    return type.createReadOnly(snapshot);
  }
}

type UnionFactory = {
  <Types extends [IAnyType, ...IAnyType[]]>(options: UnionOptions, ...types: Types): UnionType<Types>;
  <Types extends [IAnyType, ...IAnyType[]]>(...types: Types): UnionType<Types>;
};

export const union: UnionFactory = <Types extends [IAnyType, ...IAnyType[]]>(
  optionsOrType: IAnyType | UnionOptions,
  ...types: Types
): UnionType<Types> => {
  let options;
  if (optionsOrType instanceof BaseType) {
    types.unshift(optionsOrType);
  } else {
    options = optionsOrType;
  }
  return new UnionType(types, options);
};

export const maybe = <T extends IAnyType>(type: T) => {
  return union(literal<undefined>(undefined), type);
};

export const maybeNull = <T extends IAnyType>(type: T) => {
  return union(literal<null>(null), type);
};

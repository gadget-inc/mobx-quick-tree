import { types as mstTypes, UnionOptions } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, InstantiateContext, IUnionType } from "./types";

export class UnionType<Types extends IAnyType[]> extends BaseType<
  Types[number]["InputType"],
  Types[number]["OutputType"],
  Types[number]["InstanceTypeWithoutSTN"],
  Types[number]["mstType"]
> {
  constructor(private types: Types, readonly options?: UnionOptions) {
    super(
      "union",
      options ? mstTypes.union(options, ...types.map((x) => x.mstType)) : mstTypes.union(...types.map((x) => x.mstType))
    );
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    const type = this.types.find((ty) => ty.is(snapshot));
    if (!type) {
      throw new Error("couldn't find valid type from union for given snapshot");
    }
    return type.instantiate(snapshot, context);
  }
}

export const union = <Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types> => {
  return new UnionType(types);
};

export const lazyUnion = <Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types> => {
  return new UnionType(types, { eager: false });
};

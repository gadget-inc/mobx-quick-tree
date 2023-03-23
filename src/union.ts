import type { UnionOptions } from "mobx-state-tree";
import { types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import type { IAnyType, InstanceWithoutSTNTypeForType, InstantiateContext, IUnionType } from "./types";

class UnionType<Types extends IAnyType[]> extends BaseType<
  Types[number]["InputType"],
  Types[number]["OutputType"],
  InstanceWithoutSTNTypeForType<Types[number]>
> {
  constructor(private types: Types, readonly options?: UnionOptions) {
    super(options ? mstTypes.union(options, ...types.map((x) => x.mstType)) : mstTypes.union(...types.map((x) => x.mstType)));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    const type = this.types.find((ty) => ty.is(snapshot));
    if (!type) {
      // try to get MST's nice error formatting by having it create the object from this snapshot
      this.mstType.create(snapshot);
      // if that doesn't throw, throw our own error
      throw new Error("couldn't find valid type from union for given snapshot");
    }
    return type.instantiate(snapshot, context);
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.types.some((type) => type.is(value));
  }
}

export const union = <Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types> => {
  types.forEach(ensureRegistered);
  return new UnionType(types);
};

export const lazyUnion = <Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types> => {
  types.forEach(ensureRegistered);
  return new UnionType(types, { eager: false });
};

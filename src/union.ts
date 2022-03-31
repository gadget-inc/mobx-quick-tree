import { types as mstTypes, UnionOptions } from "mobx-state-tree";
import { BaseType } from "./base";
import { literal } from "./simple";
import { $quickType } from "./symbols";
import type { IAnyType, InstantiateContext } from "./types";

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

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    const type = this.types.find((ty) => ty.is(snapshot));
    if (!type) {
      throw new Error("couldn't find valid type from union for given snapshot");
    }
    return type.instantiate(snapshot, context);
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
  // TODO figure out why this isn't narrowing
  let options: UnionOptions = {};
  if ($quickType in optionsOrType) {
    types.unshift(optionsOrType as IAnyType);
  } else {
    options = optionsOrType as UnionOptions;
  }
  return new UnionType(types, options);
};

export const maybe = <T extends IAnyType>(type: T) => {
  return union(literal<undefined>(undefined), type);
};

export const maybeNull = <T extends IAnyType>(type: T) => {
  return union(literal<null>(null), type);
};

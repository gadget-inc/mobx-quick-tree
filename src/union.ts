import { types as mstTypes } from "mobx-state-tree";
import { BaseType, IAnyType } from "./base";
import { literal } from "./simple";

export class UnionType<Types extends IAnyType[]> extends BaseType<
  Types[number]["InputType"],
  Types[number]["InstanceType"],
  Types[number]["mstType"]
> {
  constructor(private types: Types) {
    super("union", mstTypes.union(...types.map((x) => x.mstType)));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const type = this.types.find((ty) => ty.is(snapshot));
    if (!type) {
      throw new Error("couldn't find valid type from union for given snapshot");
    }
    return type.createReadOnly(snapshot);
  }
}

export const union = <Types extends IAnyType[]>(...types: Types): UnionType<Types> => {
  return new UnionType(types);
};

export const maybe = <T extends IAnyType>(type: T) => {
  return union(literal<undefined>(undefined), type);
};

export const maybeNull = <T extends IAnyType>(type: T) => {
  return union(literal<null>(null), type);
};

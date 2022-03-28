import { IAnyType, ISimpleType, SnapshotIn, types } from "mobx-state-tree";
import { Primitives } from "mobx-state-tree/dist/internal";
import { BaseType } from "./base";

export class SimpleType<T, MSTType extends ISimpleType<any>> extends BaseType<T, T, MSTType> {
  static for<MSTType extends IAnyType>(mstType: MSTType): SimpleType<SnapshotIn<MSTType>, MSTType> {
    return new SimpleType(mstType.name, mstType);
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error("can't initial simple type with undefined");
    }
    return snapshot;
  }
}

export const literal = <T extends Primitives>(value: T): SimpleType<T, ISimpleType<T>> => {
  return new SimpleType(`literal<${value}>`, types.literal(value));
};

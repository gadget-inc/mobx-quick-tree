import { IAnyType, ISimpleType, SnapshotIn, types } from "mobx-state-tree";
import { BaseType } from "./base";

export type Primitives = string | number | boolean | Date | null | undefined;

export class SimpleType<T, MSTType extends ISimpleType<any>> extends BaseType<T, T, MSTType> {
  static for<MSTType extends IAnyType>(mstType: MSTType): SimpleType<SnapshotIn<MSTType>, MSTType> {
    return new SimpleType(mstType.name, mstType);
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error("can't initialize simple type with undefined");
    }
    return snapshot;
  }
}

export class LiteralType<T extends Primitives> extends SimpleType<T, ISimpleType<T>> {
  constructor(readonly value: T) {
    const mstType = types.literal<T>(value);
    super(mstType.name, mstType);
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (snapshot !== this.value) {
      throw new Error(`expected literal type to be initialized with ${this.value}`);
    }
    return this.value;
  }
}
export const literal = <T extends Primitives>(value: T): LiteralType<T> => {
  return new LiteralType(value);
};

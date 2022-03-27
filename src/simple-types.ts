import { IAnyType, ISimpleType, SnapshotIn } from "mobx-state-tree";
import { BaseType } from "./base";

export class SimpleType<T, MSTType extends ISimpleType<any>> extends BaseType<
  T,
  T,
  MSTType
> {
  static for<MSTType extends IAnyType>(
    mstType: MSTType
  ): SimpleType<SnapshotIn<MSTType>, MSTType> {
    return new SimpleType(mstType.name, mstType);
  }

  is(value: any): value is this["CreateType"] {
    return this.mstType.is(value);
  }

  createReadOnly(snapshot?: T): this["CreateType"] {
    return snapshot;
  }
}

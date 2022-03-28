import { types } from "mobx-state-tree";
import { IArrayType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType } from "./base";

export class ArrayType<T extends IAnyType> extends BaseType<
  ReadonlyArray<T["InputType"]>,
  ReadonlyArray<T["InstanceType"]>,
  IArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (!snapshot) {
      return [];
    }

    return snapshot.map((item) => this.childrenType.createReadOnly(item));
  }
}

export const array = <T extends IAnyType>(childrenType: T): ArrayType<T> => {
  return new ArrayType(childrenType);
};

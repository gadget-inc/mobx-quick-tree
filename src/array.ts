import { types } from "mobx-state-tree";
import { IArrayType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType, setParent, setType } from "./base";

export class ArrayType<T extends IAnyType> extends BaseType<
  ReadonlyArray<T["InputType"]>,
  ReadonlyArray<T["InstanceType"]>,
  IArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const array: T["InstanceType"][] = [];
    if (snapshot) {
      snapshot.forEach((child) => {
        const item = this.childrenType.createReadOnly(child);
        setParent(item, array);
        array.push(item);
      });
    }

    setType(array, this);

    return array;
  }
}

export const array = <T extends IAnyType>(childrenType: T): ArrayType<T> => {
  return new ArrayType(childrenType);
};

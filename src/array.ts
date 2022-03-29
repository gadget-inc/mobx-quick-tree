import { types } from "mobx-state-tree";
import { IArrayType } from "mobx-state-tree/dist/internal";
import { BaseType, InstantiateContext, setParent, setType } from "./base";
import type { IAnyType } from "./types";

export class ArrayType<T extends IAnyType> extends BaseType<
  ReadonlyArray<T["InputType"]>,
  ReadonlyArray<T["InstanceType"]>,
  IArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    const array: T["InstanceType"][] = [];
    if (snapshot) {
      snapshot.forEach((child) => {
        const item = this.childrenType.instantiate(child, context);
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

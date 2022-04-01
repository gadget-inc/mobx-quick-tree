import { IArrayType as MSTArrayType, types } from "mobx-state-tree";
import { BaseType, setParent, setType } from "./base";
import type { IAnyType, IArrayType, IMSTArray, Instance, InstantiateContext } from "./types";

export class QuickArray<T extends IAnyType> extends Array<T["InstanceType"]> implements IMSTArray<T> {
  static get [Symbol.species]() {
    return Array;
  }

  spliceWithArray(_index: number, _deleteCount?: number, _newItems?: Instance<T>[]): Instance<T>[] {
    throw new Error("cannot spliceWithArray on a QuickArray instance");
  }

  clear(): Instance<T>[] {
    throw new Error("cannot clear a QuickArray instance");
  }

  replace(_newItems: Instance<T>[]): Instance<T>[] {
    throw new Error("cannot replace a QuickArray instance");
  }

  remove(_value: Instance<T>): boolean {
    throw new Error("cannot remove from a QuickArray instance");
  }

  toJSON(): Instance<T>[] {
    return this;
  }
}

class ArrayType<T extends IAnyType> extends BaseType<
  Array<T["InputType"]>,
  T["OutputType"][],
  IMSTArray<T>,
  MSTArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const array = new QuickArray<T>(snapshot?.length ?? 0);
    if (snapshot) {
      snapshot.forEach((child, index) => {
        const item = this.childrenType.instantiate(child, context);
        setParent(item, array);
        array[index] = item;
      });
    }

    setType(array, this);

    return array;
  }
}

export const array = <T extends IAnyType>(childrenType: T): IArrayType<T> => {
  return new ArrayType(childrenType);
};

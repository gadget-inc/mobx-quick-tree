import { IAnyType as IAnyMSTType, IArrayType, IMSTArray, types } from "mobx-state-tree";
import { BaseType, InstantiateContext, setParent, setType } from "./base";
import type { IAnyType } from "./types";

export class QuickArray<T, M extends IAnyMSTType> extends Array<T> implements IMSTArray<M> {
  static get [Symbol.species]() {
    return Array;
  }

  spliceWithArray(_index: number, _deleteCount?: number, _newItems?: M["Type"][]): M["Type"][] {
    throw new Error("cannot spliceWithArray on a QuickArray instance");
  }

  clear(): M["Type"][] {
    throw new Error("cannot clear a QuickArray instance");
  }

  replace(_newItems: M["Type"][]): M["Type"][] {
    throw new Error("cannot replace a QuickArray instance");
  }

  remove(_value: M["Type"]): boolean {
    throw new Error("cannot remove from a QuickArray instance");
  }

  toJSON(): M["Type"][] {
    return this;
  }
}

export class ArrayType<T extends IAnyType> extends BaseType<
  ReadonlyArray<T["InputType"]>,
  QuickArray<T["InstanceType"], T["mstType"]>,
  IArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const array = new QuickArray<T["InstanceType"], T["mstType"]>(snapshot?.length ?? 0);
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

export const array = <T extends IAnyType>(childrenType: T): ArrayType<T> => {
  return new ArrayType(childrenType);
};

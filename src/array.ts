import { isStateTreeNode, types } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import { getSnapshot } from "./snapshot";
import { $context, $parent, $readOnly, $type } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, IArrayType, IMSTArray, IStateTreeNode, Instance, TreeContext } from "./types";

export class QuickArray<T extends IAnyType> extends Array<Instance<T>> implements IMSTArray<T> {
  static get [Symbol.species]() {
    return Array;
  }

  /** @hidden */
  readonly [$context]: any;
  /** @hidden */
  readonly [$parent]: IStateTreeNode | null;
  /** @hidden */
  readonly [$type]: [this] | [any];

  constructor(type: any, parent: IStateTreeNode | null, context: TreeContext, ...items: Instance<T>[]) {
    super(...items);
    this[$type] = type;
    this[$parent] = parent;
    this[$context] = context;
  }

  get [Symbol.toStringTag]() {
    return "Array" as const;
  }

  get [$readOnly]() {
    return true;
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
    return getSnapshot(this);
  }
}

export class ArrayType<T extends IAnyType> extends BaseType<Array<T["InputType"]> | undefined, T["OutputType"][], IMSTArray<T>> {
  constructor(readonly childrenType: T) {
    super(types.array(childrenType.mstType));
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (isStateTreeNode(value)) {
      return this.mstType.is(value);
    }

    if (value === undefined) {
      return true;
    }

    if (!Array.isArray(value) && !(value instanceof QuickArray)) {
      return false;
    }

    if ((value as any)[$type] === this) {
      return true;
    }

    return value.every((child: any) => this.childrenType.is(child));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"] {
    const array = new QuickArray<T>(this, parent, context);
    if (snapshot) {
      for (let index = 0; index < snapshot?.length; ++index) {
        array.push(this.childrenType.instantiate(snapshot[index], context, array));
      }
    }
    return array as this["InstanceType"];
  }

  async schemaHash() {
    return `array:${await this.childrenType.schemaHash()}`;
  }
}

export const array = <T extends IAnyType>(childrenType: T): IArrayType<T> => {
  ensureRegistered(childrenType);
  return new ArrayType(childrenType);
};

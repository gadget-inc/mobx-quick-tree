import { isStateTreeNode, types } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import { $env, $parent, $readOnly, $type } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, IArrayType, IMSTArray, IStateTreeNode, Instance, InstantiateContext } from "./types";

export class QuickArray<T extends IAnyType> extends Array<Instance<T>> implements IMSTArray<T> {
  static get [Symbol.species]() {
    return Array;
  }

  readonly [$env]: any;
  readonly [$parent]: IStateTreeNode | null;
  readonly [$type]: [this] | [any];

  constructor(type: any, parent: IStateTreeNode | null, env: any) {
    super();
    this[$type] = type;
    this[$parent] = parent;
    this[$env] = env;
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
    return this;
  }
}

class ArrayType<T extends IAnyType> extends BaseType<Array<T["InputType"]> | undefined, T["OutputType"][], IMSTArray<T>> {
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

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"] {
    const array = new QuickArray<T>(this, parent, context.env);
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

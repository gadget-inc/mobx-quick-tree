import type { Instance } from "mobx-state-tree";
import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, InstanceWithoutSTNTypeForType, InstantiateContext, IStateTreeNode, IType } from "./types";

class RefinementType<T extends IAnyType> extends BaseType<T["InputType"], T["OutputType"], InstanceWithoutSTNTypeForType<T>> {
  constructor(readonly type: T, readonly predicate: (snapshot: Instance<T> | Instance<T["mstType"]>) => boolean) {
    super(types.refinement(type.mstType, predicate));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"] {
    const instance = this.type.instantiate(snapshot, context, parent);
    if (!this.predicate(instance)) {
      throw new Error("given snapshot isn't valid for refinement type");
    }
    return instance;
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.type.is(value) && this.predicate(value);
  }

  async schemaHash() {
    return `refinement:${await this.type.schemaHash()}`;
  }
}

export const refinement = <T extends IAnyType>(
  type: T,
  predicate: (snapshot: Instance<T> | Instance<T["mstType"]>) => boolean
): IType<T["InputType"], T["OutputType"], InstanceWithoutSTNTypeForType<T>> => {
  return new RefinementType(type, predicate);
};

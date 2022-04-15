import { Instance, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, InstantiateContext, IType } from "./types";

class RefinementType<T extends IAnyType> extends BaseType<T["InputType"], T["OutputType"], T["InstanceTypeWithoutSTN"]> {
  constructor(readonly type: T, readonly predicate: (snapshot: T["InstanceType"] | Instance<T["mstType"]>) => boolean) {
    super(types.refinement(type.mstType, predicate));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const instance = this.type.instantiate(snapshot, context);
    if (!this.predicate(instance)) {
      throw new Error("given snapshot isn't valid for refinement type");
    }
    return instance;
  }
}

export const refinement = <T extends IAnyType>(
  type: T,
  predicate: (snapshot: T["InstanceType"] | Instance<T["mstType"]>) => boolean
): IType<T["InputType"], T["OutputType"], T["InstanceTypeWithoutSTN"]> => {
  return new RefinementType(type, predicate);
};

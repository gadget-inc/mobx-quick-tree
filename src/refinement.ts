import { Instance, types } from "mobx-state-tree";
import { BaseType, InstantiateContext } from "./base";
import type { IAnyType } from "./types";

export class RefinementType<T extends IAnyType> extends BaseType<T["InputType"], T["InstanceType"], T["mstType"]> {
  constructor(readonly type: T, readonly predicate: (snapshot: T["InstanceType"] | Instance<T["mstType"]>) => boolean) {
    super(type.name, types.refinement(type.mstType, predicate));
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
): RefinementType<T> => {
  return new RefinementType(type, predicate);
};

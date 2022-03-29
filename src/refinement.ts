import { Instance, types } from "mobx-state-tree";
import { BaseType, IAnyType } from "./base";

class RefinementType<T extends IAnyType> extends BaseType<T["InputType"], T["InstanceType"], T["mstType"]> {
  constructor(
    readonly type: T["mstType"],
    readonly predicate: (snapshot: T["InstanceType"] | Instance<T["mstType"]>) => boolean
  ) {
    super(type.name, types.refinement(type.mstType, predicate));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const instance = this.type.createReadOnly(snapshot);
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

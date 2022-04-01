import { Instance as MSTInstance, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, InstantiateContext } from "./types";

export class LateType<T extends IAnyType> extends BaseType<
  T["InputType"],
  T["OutputType"],
  T["InstanceTypeWithoutSTN"],
  T["mstType"]
> {
  private cachedType: T | undefined;

  constructor(private readonly fn: () => T) {
    super(
      "late",
      types.late(() => this.type.mstType)
    );
  }

  create(snapshot?: this["InputType"], env?: any): MSTInstance<T["mstType"]> {
    return this.type.mstType.create(snapshot, env);
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    return this.type.instantiate(snapshot, context);
  }

  private get type() {
    this.cachedType ??= this.fn();
    return this.cachedType;
  }
}

export const late = <T extends IAnyType>(fn: () => T): T => {
  return new LateType(fn) as unknown as T;
};

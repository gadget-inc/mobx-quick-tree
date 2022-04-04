import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, InstantiateContext } from "./types";

export class LateType<T extends IAnyType> extends BaseType<
  T["InputType"],
  T["OutputType"],
  T["InstanceTypeWithoutSTN"],
  T["mstType"]
> {
  private cachedType: T | null | undefined;

  constructor(private readonly fn: () => T) {
    super(
      "late",
      types.late<T["mstType"]>(() => this.type?.mstType as T["mstType"])
    );
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    return this.type.instantiate(snapshot, context);
  }

  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.type.is(value);
  }

  private get type() {
    this.cachedType ??= this.fn();
    return this.cachedType;
  }
}

export const late = <T extends IAnyType>(fn: () => T): T => {
  return new LateType(fn) as unknown as T;
};

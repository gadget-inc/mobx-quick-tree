import { types } from "mobx-state-tree";
import { BaseType, IAnyType } from "./base";

export class LateType<T extends IAnyType> extends BaseType<T["InputType"], T["InstanceType"], T["mstType"]> {
  private cachedType: T | undefined;

  constructor(private readonly fn: () => T) {
    super(
      "late",
      types.late(() => this.type.mstType)
    );
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    return this.type.createReadOnly(snapshot);
  }

  private get type() {
    this.cachedType ??= this.fn();
    return this.cachedType;
  }
}

export const late = <T extends IAnyType>(fn: () => T): LateType<T> => {
  return new LateType(fn);
};

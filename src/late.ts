import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import type { IAnyType, IStateTreeNode, InstanceWithoutSTNTypeForType, InstantiateContext } from "./types";

export class LateType<T extends IAnyType> extends BaseType<T["InputType"], T["OutputType"], InstanceWithoutSTNTypeForType<T>> {
  private cachedType: T | null | undefined;

  constructor(private readonly fn: () => T) {
    super(types.late<T["mstType"]>(`late(${fn.toString()})`, () => this.type?.mstType as T["mstType"]));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"] {
    return this.type.instantiate(snapshot, context, parent);
  }

  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.type.is(value);
  }

  get type() {
    this.cachedType ??= this.fn();
    ensureRegistered(this.cachedType);
    return this.cachedType;
  }
}

export const late = <T extends IAnyType>(fn: () => T): T => {
  return new LateType(fn) as unknown as T;
};

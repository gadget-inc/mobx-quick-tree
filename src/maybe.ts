import { types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import type { IAnyStateTreeNode, IAnyType, IMaybeNullType, IMaybeType, InstanceWithoutSTNTypeForType, InstantiateContext } from "./types";

class MaybeType<Type extends IAnyType> extends BaseType<
  Type["InputType"] | undefined,
  Type["OutputType"] | undefined,
  InstanceWithoutSTNTypeForType<Type> | undefined
> {
  constructor(private type: Type) {
    super(mstTypes.maybe(type.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      return undefined;
    }
    return this.type.instantiate(snapshot, context);
  }

  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (value === undefined) {
      return true;
    }
    return this.type.is(value);
  }
}

class MaybeNullType<Type extends IAnyType> extends BaseType<
  Type["InputType"] | null | undefined,
  Type["OutputType"] | null,
  InstanceWithoutSTNTypeForType<Type> | null
> {
  constructor(private type: Type) {
    super(mstTypes.maybeNull(type.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined || snapshot === null) {
      // Special case for things like types.frozen, or types.literal(undefined), where MST prefers the subtype over maybeNull
      if (this.type.is(snapshot)) {
        return this.type.instantiate(snapshot, context);
      }

      return null;
    }
    return this.type.instantiate(snapshot, context);
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (value === undefined || value === null) {
      return true;
    }
    return this.type.is(value);
  }
}

export const maybe = <T extends IAnyType>(type: T): IMaybeType<T> => {
  ensureRegistered(type);
  return new MaybeType(type);
};

export const maybeNull = <T extends IAnyType>(type: T): IMaybeNullType<T> => {
  ensureRegistered(type);
  return new MaybeNullType(type);
};

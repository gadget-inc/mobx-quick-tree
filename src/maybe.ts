import { IMaybe, IMaybeNull, types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyType, IMaybeNullType, IMaybeType, InstantiateContext } from "./types";

export class MaybeType<Type extends IAnyType> extends BaseType<
  Type["InputType"] | undefined,
  Type["OutputType"] | undefined,
  Type["InstanceTypeWithoutSTN"] | undefined,
  IMaybe<Type["mstType"]>
> {
  constructor(private type: Type) {
    super(`maybe<${type.name}>`, mstTypes.maybe(type.mstType));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
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

export class MaybeNullType<Type extends IAnyType> extends BaseType<
  Type["InputType"] | null | undefined,
  Type["OutputType"] | null,
  Type["InstanceTypeWithoutSTN"] | null,
  IMaybeNull<Type["mstType"]>
> {
  constructor(private type: Type) {
    super(`maybe<${type.name}>`, mstTypes.maybeNull(type.mstType));
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined || snapshot === null) {
      return null;
    }
    return this.type.instantiate(snapshot, context);
  }

  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (value === undefined || value === null) {
      return true;
    }
    return this.type.is(value);
  }
}

export const maybe = <T extends IAnyType>(type: T): IMaybeType<T> => {
  return new MaybeType(type);
};

export const maybeNull = <T extends IAnyType>(type: T): IMaybeNullType<T> => {
  return new MaybeNullType(type);
};

import { IType, types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import { SimpleType } from "./simple";

export const frozen = <T = any>(): BaseType<T, T, IType<T, T, T>> => {
  return new SimpleType("frozen", mstTypes.frozen<T>());
};

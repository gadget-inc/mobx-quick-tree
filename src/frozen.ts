import { types } from "mobx-state-tree";
import { SimpleType } from "./simple";
import { ISimpleType } from "./types";

export const frozen = <T = any>(): ISimpleType<T> => {
  return new SimpleType("frozen", types.frozen<T>());
};

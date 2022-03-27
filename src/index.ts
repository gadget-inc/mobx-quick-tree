import { types as mstTypes } from "mobx-state-tree";
import { model } from "./model";
import { SimpleType } from "./simple";

export const types = {
  model,
  boolean: SimpleType.for(mstTypes.boolean),
  string: SimpleType.for(mstTypes.string),
};

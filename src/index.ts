import { types as mstTypes } from "mobx-state-tree";
import { model } from "./model";
import { SimpleType } from "./simple-types";

export const types = {
  model,
  boolean: SimpleType.for(mstTypes.boolean),
};

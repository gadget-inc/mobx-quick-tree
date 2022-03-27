import { types as mstTypes } from "mobx-state-tree";
import { frozen } from "./frozen";
import { model } from "./model";
import { SimpleType } from "./simple";

export const types = {
  boolean: SimpleType.for(mstTypes.boolean),
  Date: SimpleType.for(mstTypes.Date),
  integer: SimpleType.for(mstTypes.integer),
  null: SimpleType.for(mstTypes.null),
  number: SimpleType.for(mstTypes.number),
  string: SimpleType.for(mstTypes.string),

  frozen,
  model,
};

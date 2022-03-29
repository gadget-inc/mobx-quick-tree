import { types as mstTypes } from "mobx-state-tree";
import { array } from "./array";
import { compose } from "./compose";
import { frozen } from "./frozen";
import { late } from "./late";
import { map } from "./map";
import { model } from "./model";
import { optional } from "./optional";
import { literal, SimpleType } from "./simple";
import { maybe, maybeNull, union } from "./union";

export const types = {
  boolean: SimpleType.for(mstTypes.boolean),
  Date: SimpleType.for(mstTypes.Date),
  identifier: SimpleType.for(mstTypes.identifier),
  integer: SimpleType.for(mstTypes.integer),
  null: SimpleType.for(mstTypes.null),
  number: SimpleType.for(mstTypes.number),
  string: SimpleType.for(mstTypes.string),

  array,
  compose,
  frozen,
  late,
  literal,
  map,
  maybe,
  maybeNull,
  model,
  optional,
  union,
};

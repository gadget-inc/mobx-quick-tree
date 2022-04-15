import { types as mstTypes } from "mobx-state-tree";
import { array } from "./array";
import { compose } from "./compose";
import { custom } from "./custom";
import { enumeration } from "./enumeration";
import { frozen } from "./frozen";
import { late } from "./late";
import { map } from "./map";
import { maybe, maybeNull } from "./maybe";
import { model } from "./model";
import { optional } from "./optional";
import { reference, safeReference } from "./reference";
import { refinement } from "./refinement";
import { DateType, literal, SimpleType } from "./simple";
import { lazyUnion, union } from "./union";

export * from "./api";
export * from "./types";

export const types = {
  boolean: SimpleType.for(mstTypes.boolean),
  Date: new DateType(mstTypes.Date),
  identifier: SimpleType.for(mstTypes.identifier),
  integer: SimpleType.for(mstTypes.integer),
  literal,
  null: SimpleType.for(mstTypes.null),
  number: SimpleType.for(mstTypes.number),
  string: SimpleType.for(mstTypes.string),

  array,
  compose,
  custom,
  enumeration,
  frozen,
  late,
  lazyUnion,
  map,
  maybe,
  maybeNull,
  model,
  optional,
  reference,
  refinement,
  safeReference,
  union,
};

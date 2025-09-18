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
import { DateType, IntegerType, NullType, SimpleType, literal } from "./simple";
import { lazyUnion, union } from "./union";

export * from "./api";
export * from "./types";
export { $type } from "./symbols";
export { setDefaultShouldEmitPatchOnChange } from "./class-model";

export const types = {
  boolean: SimpleType.for("boolean", mstTypes.boolean),
  Date: new DateType(mstTypes.Date),
  identifier: SimpleType.for("string", mstTypes.identifier),
  integer: new IntegerType(),
  literal,
  null: new NullType(),
  number: SimpleType.for("number", mstTypes.number),
  string: SimpleType.for("string", mstTypes.string),

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

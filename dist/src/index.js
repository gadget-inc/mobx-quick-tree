"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.setDefaultShouldEmitPatchOnChange = exports.$type = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const array_1 = require("./array");
const compose_1 = require("./compose");
const custom_1 = require("./custom");
const enumeration_1 = require("./enumeration");
const frozen_1 = require("./frozen");
const late_1 = require("./late");
const map_1 = require("./map");
const maybe_1 = require("./maybe");
const model_1 = require("./model");
const optional_1 = require("./optional");
const reference_1 = require("./reference");
const refinement_1 = require("./refinement");
const simple_1 = require("./simple");
const union_1 = require("./union");
__exportStar(require("./api"), exports);
__exportStar(require("./types"), exports);
var symbols_1 = require("./symbols");
Object.defineProperty(exports, "$type", { enumerable: true, get: function () { return symbols_1.$type; } });
var class_model_1 = require("./class-model");
Object.defineProperty(exports, "setDefaultShouldEmitPatchOnChange", { enumerable: true, get: function () { return class_model_1.setDefaultShouldEmitPatchOnChange; } });
exports.types = {
    boolean: simple_1.SimpleType.for("boolean", mobx_state_tree_1.types.boolean),
    Date: new simple_1.DateType(mobx_state_tree_1.types.Date),
    identifier: simple_1.SimpleType.for("string", mobx_state_tree_1.types.identifier),
    integer: new simple_1.IntegerType(),
    literal: simple_1.literal,
    null: new simple_1.NullType(),
    number: simple_1.SimpleType.for("number", mobx_state_tree_1.types.number),
    string: simple_1.SimpleType.for("string", mobx_state_tree_1.types.string),
    array: array_1.array,
    compose: compose_1.compose,
    custom: custom_1.custom,
    enumeration: enumeration_1.enumeration,
    frozen: frozen_1.frozen,
    late: late_1.late,
    lazyUnion: union_1.lazyUnion,
    map: map_1.map,
    maybe: maybe_1.maybe,
    maybeNull: maybe_1.maybeNull,
    model: model_1.model,
    optional: optional_1.optional,
    reference: reference_1.reference,
    refinement: refinement_1.refinement,
    safeReference: reference_1.safeReference,
    union: union_1.union,
};

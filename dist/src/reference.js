"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reference = exports.SafeReferenceType = exports.ReferenceType = void 0;
exports.safeReference = safeReference;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const lodash_memoize_1 = __importDefault(require("lodash.memoize"));
const referenceSchemaHash = async (type, targetType) => {
    return `${type}:${await targetType.schemaHash()}`;
};
class ReferenceType extends base_1.BaseType {
    constructor(targetType, options) {
        super(mobx_state_tree_1.types.reference(targetType.mstType, options));
        this.targetType = targetType;
        this.schemaHash = (0, lodash_memoize_1.default)(async () => {
            return await referenceSchemaHash("reference", this.targetType);
        });
    }
    instantiate(snapshot, context, _parent) {
        if (!snapshot || !context.referenceCache.has(snapshot)) {
            throw new Error(`can't resolve reference ${snapshot}`);
        }
        return context.referenceCache.get(snapshot);
    }
    is(value) {
        return typeof value == "string";
    }
}
exports.ReferenceType = ReferenceType;
class SafeReferenceType extends base_1.BaseType {
    constructor(targetType, options) {
        super(mobx_state_tree_1.types.safeReference(targetType.mstType, options));
        this.targetType = targetType;
        this.options = options;
        this.schemaHash = (0, lodash_memoize_1.default)(async () => {
            return await referenceSchemaHash("safe-reference", this.targetType);
        });
    }
    instantiate(snapshot, context, _parent) {
        if (!snapshot || !context.referenceCache.has(snapshot)) {
            return undefined;
        }
        return context.referenceCache.get(snapshot);
    }
    is(value) {
        return typeof value == "string";
    }
}
exports.SafeReferenceType = SafeReferenceType;
const reference = (targetType, options) => {
    (0, class_model_1.ensureRegistered)(targetType);
    return new ReferenceType(targetType, options);
};
exports.reference = reference;
function safeReference(targetType, options) {
    (0, class_model_1.ensureRegistered)(targetType);
    return new SafeReferenceType(targetType, options);
}

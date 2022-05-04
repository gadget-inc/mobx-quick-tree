"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeReference = exports.reference = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class ReferenceType extends base_1.BaseType {
    constructor(targetType, options) {
        super(mobx_state_tree_1.types.reference(targetType.mstType, options));
        this.targetType = targetType;
    }
    instantiate(snapshot, context) {
        if (!snapshot || !context.referenceCache.has(snapshot)) {
            throw new Error(`can't resolve reference ${snapshot}`);
        }
        return context.referenceCache.get(snapshot);
    }
    is(value) {
        return typeof value == "string";
    }
}
class SafeReferenceType extends base_1.BaseType {
    constructor(targetType, options) {
        super(mobx_state_tree_1.types.safeReference(targetType.mstType, options));
        this.targetType = targetType;
    }
    instantiate(snapshot, context) {
        if (!snapshot || !context.referenceCache.has(snapshot)) {
            return undefined;
        }
        return context.referenceCache.get(snapshot);
    }
    is(value) {
        return typeof value == "string";
    }
}
const reference = (targetType, options) => {
    return new ReferenceType(targetType, options);
};
exports.reference = reference;
const safeReference = (targetType, options) => {
    return new SafeReferenceType(targetType, options);
};
exports.safeReference = safeReference;

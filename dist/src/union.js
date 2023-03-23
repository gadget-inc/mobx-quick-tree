"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyUnion = exports.union = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
class UnionType extends base_1.BaseType {
    constructor(types, options) {
        super(options ? mobx_state_tree_1.types.union(options, ...types.map((x) => x.mstType)) : mobx_state_tree_1.types.union(...types.map((x) => x.mstType)));
        this.types = types;
        this.options = options;
    }
    instantiate(snapshot, context) {
        const type = this.types.find((ty) => ty.is(snapshot));
        if (!type) {
            // try to get MST's nice error formatting by having it create the object from this snapshot
            this.mstType.create(snapshot);
            // if that doesn't throw, throw our own error
            throw new Error("couldn't find valid type from union for given snapshot");
        }
        return type.instantiate(snapshot, context);
    }
    is(value) {
        return this.types.some((type) => type.is(value));
    }
}
const union = (...types) => {
    types.forEach(class_model_1.ensureRegistered);
    return new UnionType(types);
};
exports.union = union;
const lazyUnion = (...types) => {
    types.forEach(class_model_1.ensureRegistered);
    return new UnionType(types, { eager: false });
};
exports.lazyUnion = lazyUnion;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeNull = exports.maybe = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
class MaybeType extends base_1.BaseType {
    constructor(type) {
        super(mobx_state_tree_1.types.maybe(type.mstType));
        this.type = type;
    }
    instantiate(snapshot, context, parent) {
        if (snapshot === undefined) {
            return undefined;
        }
        return this.type.instantiate(snapshot, context, parent);
    }
    is(value) {
        if (value === undefined) {
            return true;
        }
        return this.type.is(value);
    }
    async schemaHash() {
        return `maybe:${await this.type.schemaHash()}`;
    }
}
class MaybeNullType extends base_1.BaseType {
    constructor(type) {
        super(mobx_state_tree_1.types.maybeNull(type.mstType));
        this.type = type;
    }
    instantiate(snapshot, context, parent) {
        if (snapshot === undefined || snapshot === null) {
            // Special case for things like types.frozen, or types.literal(undefined), where MST prefers the subtype over maybeNull
            if (this.type.is(snapshot)) {
                return this.type.instantiate(snapshot, context, parent);
            }
            return null;
        }
        return this.type.instantiate(snapshot, context, parent);
    }
    is(value) {
        if (value === undefined || value === null) {
            return true;
        }
        return this.type.is(value);
    }
    async schemaHash() {
        return `maybeNull:${await this.type.schemaHash()}`;
    }
}
const maybe = (type) => {
    (0, class_model_1.ensureRegistered)(type);
    return new MaybeType(type);
};
exports.maybe = maybe;
const maybeNull = (type) => {
    (0, class_model_1.ensureRegistered)(type);
    return new MaybeNullType(type);
};
exports.maybeNull = maybeNull;

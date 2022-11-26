"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeNull = exports.maybe = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class MaybeType extends base_1.BaseType {
    constructor(type) {
        super(mobx_state_tree_1.types.maybe(type.mstType));
        this.type = type;
    }
    instantiate(snapshot, context) {
        if (snapshot === undefined) {
            return undefined;
        }
        return this.type.instantiate(snapshot, context);
    }
    is(value) {
        if (value === undefined) {
            return true;
        }
        return this.type.is(value);
    }
}
class MaybeNullType extends base_1.BaseType {
    constructor(type) {
        super(mobx_state_tree_1.types.maybeNull(type.mstType));
        this.type = type;
    }
    instantiate(snapshot, context) {
        if (snapshot === undefined || snapshot === null) {
            // Special case for things like types.frozen, or types.literal(undefined), where MST prefers the subtype over maybeNull
            if (this.type.is(snapshot)) {
                return this.type.instantiate(snapshot, context);
            }
            return null;
        }
        return this.type.instantiate(snapshot, context);
    }
    is(value) {
        if (value === undefined || value === null) {
            return true;
        }
        return this.type.is(value);
    }
}
const maybe = (type) => {
    return new MaybeType(type);
};
exports.maybe = maybe;
const maybeNull = (type) => {
    return new MaybeNullType(type);
};
exports.maybeNull = maybeNull;

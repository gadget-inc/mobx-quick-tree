"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frozen = exports.FrozenType = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class FrozenType extends base_1.BaseType {
    constructor() {
        super(mobx_state_tree_1.types.frozen());
    }
    instantiate(snapshot, _context, _parent) {
        if (typeof snapshot == "function") {
            throw new Error("frozen types can't be instantiated with functions");
        }
        return snapshot;
    }
    is(value) {
        // Valid values for frozen types have to be serializable
        return typeof value !== "function";
    }
    async schemaHash() {
        return "frozen";
    }
}
exports.FrozenType = FrozenType;
const frozen = () => {
    return new FrozenType();
};
exports.frozen = frozen;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.custom = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class CustomType extends base_1.BaseType {
    constructor(options) {
        super(mobx_state_tree_1.types.custom(options));
        this.options = options;
    }
    instantiate(snapshot, _context) {
        if (snapshot === undefined) {
            throw new Error("can't initialize custom type with undefined");
        }
        return this.options.fromSnapshot(snapshot);
    }
    is(value) {
        return this.mstType.is(value);
    }
}
const custom = (options) => {
    return new CustomType(options);
};
exports.custom = custom;

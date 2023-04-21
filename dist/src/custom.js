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
    instantiate(snapshot, _context, parent) {
        if (snapshot === undefined) {
            throw new Error("can't initialize custom type with undefined");
        }
        const object = this.options.fromSnapshot(snapshot);
        (0, base_1.setParent)(object, parent);
        return object;
    }
    is(value) {
        return this.mstType.is(value);
    }
}
const custom = (options) => {
    return new CustomType(options);
};
exports.custom = custom;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumeration = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class EnumerationType extends base_1.BaseType {
    constructor(name, options) {
        super(mobx_state_tree_1.types.enumeration([...options]));
        this.name = name;
        this.options = options;
    }
    instantiate(snapshot, _context) {
        if (typeof snapshot == "string" && this.options.includes(snapshot)) {
            return snapshot;
        }
        throw new Error("unknown enum value");
    }
    is(value) {
        return this.options.includes(value);
    }
}
const enumeration = (nameOrOptions, options) => {
    let name;
    if (typeof nameOrOptions == "string") {
        name = nameOrOptions;
        options ?? (options = []);
    }
    else {
        name = "enumeration";
        options = nameOrOptions;
    }
    return new EnumerationType(name, options);
};
exports.enumeration = enumeration;

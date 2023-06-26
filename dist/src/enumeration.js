"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumeration = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const lodash_memoize_1 = __importDefault(require("lodash.memoize"));
class EnumerationType extends base_1.BaseType {
    constructor(name, options) {
        super(mobx_state_tree_1.types.enumeration([...options]));
        this.name = name;
        this.options = options;
        this.schemaHash = (0, lodash_memoize_1.default)(async () => {
            return `enum:${this.options.join("|")}`;
        });
    }
    instantiate(snapshot, _context, _parent) {
        if (typeof snapshot == "string" && this.options.includes(snapshot)) {
            return snapshot;
        }
        throw new Error(`Unknown enum value \`${snapshot}\`. Options are: ${this.options.join(", ")}`);
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

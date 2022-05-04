"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optional = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class OptionalType extends base_1.BaseType {
    constructor(type, defaultValueOrFunc, undefinedValues) {
        super(undefinedValues
            ? mobx_state_tree_1.types.optional(type.mstType, defaultValueOrFunc, undefinedValues)
            : mobx_state_tree_1.types.optional(type.mstType, defaultValueOrFunc));
        this.type = type;
        this.defaultValueOrFunc = defaultValueOrFunc;
        this.undefinedValues = undefinedValues;
    }
    instantiate(snapshot, context) {
        if (this.undefinedValues) {
            if (this.undefinedValues.includes(snapshot)) {
                snapshot = this.defaultValue;
            }
        }
        else if (snapshot === undefined) {
            snapshot = this.defaultValue;
        }
        return this.type.instantiate(snapshot, context);
    }
    is(value) {
        if (this.undefinedValues) {
            if (this.undefinedValues.includes(value)) {
                return true;
            }
        }
        else if (value === undefined) {
            return true;
        }
        return this.type.is(value);
    }
    get defaultValue() {
        return this.defaultValueOrFunc instanceof Function ? this.defaultValueOrFunc() : this.defaultValueOrFunc;
    }
}
const optional = (type, defaultValue, undefinedValues) => {
    return new OptionalType(type, defaultValue, undefinedValues);
};
exports.optional = optional;

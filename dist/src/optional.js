"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optional = exports.OptionalType = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
class OptionalType extends base_1.BaseType {
    constructor(type, defaultValueOrFunc, undefinedValues = [undefined]) {
        super(undefinedValues
            ? mobx_state_tree_1.types.optional(type.mstType, defaultValueOrFunc, undefinedValues)
            : mobx_state_tree_1.types.optional(type.mstType, defaultValueOrFunc));
        this.type = type;
        this.defaultValueOrFunc = defaultValueOrFunc;
        this.undefinedValues = undefinedValues;
    }
    instantiate(snapshot, context, parent) {
        if (this.undefinedValues) {
            if (this.undefinedValues.includes(snapshot)) {
                snapshot = this.defaultValue;
            }
        }
        else if (snapshot === undefined) {
            snapshot = this.defaultValue;
        }
        return this.type.instantiate(snapshot, context, parent);
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
exports.OptionalType = OptionalType;
const optional = (type, defaultValue, undefinedValues) => {
    (0, class_model_1.ensureRegistered)(type);
    return new OptionalType(type, defaultValue, undefinedValues);
};
exports.optional = optional;

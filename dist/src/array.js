"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.ArrayType = exports.QuickArray = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const snapshot_1 = require("./snapshot");
const symbols_1 = require("./symbols");
const reference_1 = require("./reference");
class QuickArray extends Array {
    static get [Symbol.species]() {
        return Array;
    }
    constructor(type, parent, context, ...items) {
        super(...items);
        this[symbols_1.$type] = type;
        this[symbols_1.$parent] = parent;
        this[symbols_1.$context] = context;
    }
    get [Symbol.toStringTag]() {
        return "Array";
    }
    get [symbols_1.$readOnly]() {
        return true;
    }
    spliceWithArray(_index, _deleteCount, _newItems) {
        throw new Error("cannot spliceWithArray on a QuickArray instance");
    }
    clear() {
        throw new Error("cannot clear a QuickArray instance");
    }
    replace(_newItems) {
        throw new Error("cannot replace a QuickArray instance");
    }
    remove(_value) {
        throw new Error("cannot remove from a QuickArray instance");
    }
    toJSON() {
        return (0, snapshot_1.getSnapshot)(this);
    }
}
exports.QuickArray = QuickArray;
class ArrayType extends base_1.BaseType {
    constructor(childrenType) {
        super(mobx_state_tree_1.types.array(childrenType.mstType));
        this.childrenType = childrenType;
    }
    is(value) {
        if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
            return this.mstType.is(value);
        }
        if (value === undefined) {
            return true;
        }
        if (!Array.isArray(value) && !(value instanceof QuickArray)) {
            return false;
        }
        if (value[symbols_1.$type] === this) {
            return true;
        }
        return value.every((child) => this.childrenType.is(child));
    }
    instantiate(snapshot, context, parent) {
        const array = new QuickArray(this, parent, context);
        if (snapshot) {
            let instances = snapshot.map((element) => this.childrenType.instantiate(element, context, array));
            if (this.childrenType instanceof reference_1.SafeReferenceType && this.childrenType.options?.acceptsUndefined === false) {
                instances = instances.filter((instance) => instance != null);
            }
            array.push(...instances);
        }
        return array;
    }
    async schemaHash() {
        return `array:${await this.childrenType.schemaHash()}`;
    }
}
exports.ArrayType = ArrayType;
const array = (childrenType) => {
    (0, class_model_1.ensureRegistered)(childrenType);
    return new ArrayType(childrenType);
};
exports.array = array;

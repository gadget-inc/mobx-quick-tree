"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = exports.QuickArray = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const symbols_1 = require("./symbols");
class QuickArray extends Array {
    static get [Symbol.species]() {
        return Array;
    }
    get [Symbol.toStringTag]() {
        return "Array";
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
        return this;
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
    instantiate(snapshot, context) {
        const array = new QuickArray(snapshot?.length ?? 0);
        if (snapshot) {
            snapshot.forEach((child, index) => {
                const item = this.childrenType.instantiate(child, context);
                (0, base_1.setParent)(item, array);
                array[index] = item;
            });
        }
        (0, base_1.setType)(array, this);
        return array;
    }
}
const array = (childrenType) => {
    return new ArrayType(childrenType);
};
exports.array = array;

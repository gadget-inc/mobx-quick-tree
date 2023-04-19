"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refinement = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class RefinementType extends base_1.BaseType {
    constructor(type, predicate) {
        super(mobx_state_tree_1.types.refinement(type.mstType, predicate));
        this.type = type;
        this.predicate = predicate;
    }
    instantiate(snapshot, context, parent) {
        const instance = this.type.instantiate(snapshot, context, parent);
        if (!this.predicate(instance)) {
            throw new Error("given snapshot isn't valid for refinement type");
        }
        return instance;
    }
    is(value) {
        return this.type.is(value) && this.predicate(value);
    }
}
const refinement = (type, predicate) => {
    return new RefinementType(type, predicate);
};
exports.refinement = refinement;

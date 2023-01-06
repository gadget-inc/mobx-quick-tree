"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.late = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class LateType extends base_1.BaseType {
    constructor(fn) {
        super(mobx_state_tree_1.types.late(() => this.type?.mstType));
        this.fn = fn;
    }
    instantiate(snapshot, context) {
        return this.type.instantiate(snapshot, context);
    }
    is(value) {
        return this.type.is(value);
    }
    get type() {
        this.cachedType ?? (this.cachedType = this.fn());
        return this.cachedType;
    }
}
const late = (fn) => {
    return new LateType(fn);
};
exports.late = late;

"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseType = void 0;
const symbols_1 = require("./symbols");
class BaseType {
    constructor(mstType) {
        /* */
        this[_a] = undefined;
        this.name = mstType.name;
        Object.defineProperty(this, "mstType", {
            value: mstType,
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }
    /**
     * Create a new instance of this class model in observable mode. Uses an `mobx-state-tree` type under the hood.
     */
    create(snapshot, env) {
        return this.mstType.create(snapshot, env);
    }
    /**
     * Create a new instance of this class model in readonly mode. Properties and views are accessible on readonly instances but actions will throw if run.
     */
    createReadOnly(snapshot, env) {
        const context = {
            referenceCache: new Map(),
            referencesToResolve: [],
            env,
        };
        const instance = this.instantiate(snapshot, context, null);
        for (const resolver of context.referencesToResolve) {
            resolver();
        }
        return instance;
    }
}
exports.BaseType = BaseType;
_a = symbols_1.$quickType;

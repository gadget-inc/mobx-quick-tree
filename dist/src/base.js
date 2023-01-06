"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.setParent = exports.setType = exports.BaseType = void 0;
const array_1 = require("./array");
const symbols_1 = require("./symbols");
class BaseType {
    constructor(mstType) {
        this[_a] = undefined;
        this.name = mstType.name;
        Object.defineProperty(this, "mstType", {
            value: mstType,
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }
    create(snapshot, env) {
        return this.mstType.create(snapshot, env);
    }
    createReadOnly(snapshot, env) {
        const context = {
            referenceCache: new Map(),
            referencesToResolve: [],
            env,
        };
        const instance = this.instantiate(snapshot, context);
        for (const resolver of context.referencesToResolve) {
            resolver();
        }
        const maybeObjectInstance = instance;
        if (typeof maybeObjectInstance === "object" && maybeObjectInstance !== null) {
            maybeObjectInstance[symbols_1.$env] = env;
        }
        return instance;
    }
}
exports.BaseType = BaseType;
_a = symbols_1.$quickType;
/** @hidden */
const setType = (value, type) => {
    if (value && typeof value == "object") {
        if (value instanceof array_1.QuickArray) {
            Object.defineProperty(value, symbols_1.$type, {
                value: type,
                enumerable: false,
                writable: false
            });
        }
        else {
            value[symbols_1.$type] = type;
        }
    }
};
exports.setType = setType;
/** @hidden */
const setParent = (value, parent) => {
    if (value && typeof value == "object" && !value[symbols_1.$parent]) {
        if (value instanceof array_1.QuickArray) {
            Object.defineProperty(value, symbols_1.$parent, {
                value: parent,
                enumerable: false,
                writable: false
            });
        }
        else {
            value[symbols_1.$parent] = parent;
        }
    }
};
exports.setParent = setParent;

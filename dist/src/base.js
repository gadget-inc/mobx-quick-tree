"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.setEnv = exports.setParent = exports.setType = exports.BaseType = void 0;
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
    /**
     * @deprecated Prefer the top level `create` function instead
     */
    create(snapshot, env) {
        return this.mstType.create(snapshot, env);
    }
    /**
     * @deprecated Prefer the top level `create` function instead
     */
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
        (0, exports.setEnv)(instance, env);
        return instance;
    }
}
exports.BaseType = BaseType;
_a = symbols_1.$quickType;
/** @hidden */
const setType = (value, type) => {
    if (value && typeof value == "object") {
        Reflect.defineProperty(value, symbols_1.$type, {
            value: type,
            configurable: false,
            enumerable: false,
            writable: false,
        });
    }
};
exports.setType = setType;
/** @hidden */
const setParent = (value, parent) => {
    if (value && typeof value == "object") {
        Reflect.defineProperty(value, symbols_1.$parent, {
            value: parent,
            configurable: false,
            enumerable: false,
            writable: false,
        });
    }
};
exports.setParent = setParent;
/** @hidden */
const setEnv = (instance, env) => {
    if (typeof instance === "object" && instance !== null) {
        Reflect.defineProperty(instance, symbols_1.$env, {
            value: env,
            configurable: false,
            enumerable: false,
            writable: false,
        });
    }
};
exports.setEnv = setEnv;

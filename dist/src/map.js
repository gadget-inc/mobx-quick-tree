"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = exports.MapType = exports.QuickMap = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const snapshot_1 = require("./snapshot");
const symbols_1 = require("./symbols");
const reference_1 = require("./reference");
class QuickMap extends Map {
    static get [Symbol.species]() {
        return Map;
    }
    constructor(type, parent, context) {
        super();
        this[symbols_1.$type] = type;
        this[symbols_1.$parent] = parent;
        this[symbols_1.$context] = context;
    }
    get [Symbol.toStringTag]() {
        return "Map";
    }
    get [symbols_1.$readOnly]() {
        return true;
    }
    forEach(callbackfn, thisArg) {
        super.forEach((value, key) => callbackfn(value, key, thisArg ?? this));
    }
    put(_value) {
        throw new Error("put not supported in QuickMap");
    }
    merge(_other) {
        throw new Error("merge not supported in QuickMap");
    }
    replace(_values) {
        throw new Error("replace not supported in QuickMap");
    }
    toJSON() {
        return (0, snapshot_1.getSnapshot)(this);
    }
    observe(_listener, _fireImmediately) {
        throw new Error("observer not supported in QuickMap");
    }
    intercept(_handler) {
        throw new Error("intercept not supported in QuickMap");
    }
}
exports.QuickMap = QuickMap;
class MapType extends base_1.BaseType {
    constructor(childrenType) {
        super(mobx_state_tree_1.types.map(childrenType.mstType));
        this.childrenType = childrenType;
    }
    is(value) {
        if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
            return this.mstType.is(value);
        }
        if (value === undefined) {
            return true;
        }
        if (typeof value !== "object" || value === null) {
            return false;
        }
        if (!(value instanceof QuickMap) && Object.getPrototypeOf(value) != Object.prototype) {
            return false;
        }
        if (value[symbols_1.$type] === this) {
            return true;
        }
        const children = Object.values(value);
        return children.every((child) => this.childrenType.is(child));
    }
    instantiate(snapshot, context, parent) {
        const map = new QuickMap(this, parent, context);
        if (snapshot) {
            for (const key in snapshot) {
                const item = this.childrenType.instantiate(snapshot[key], context, map);
                if (this.childrenType instanceof reference_1.SafeReferenceType && this.childrenType.options?.acceptsUndefined === false) {
                    if (item == null) {
                        continue;
                    }
                }
                map.set(key, item);
            }
        }
        return map;
    }
    async schemaHash() {
        return `map:${await this.childrenType.schemaHash()}`;
    }
}
exports.MapType = MapType;
const map = (childrenType) => {
    (0, class_model_1.ensureRegistered)(childrenType);
    return new MapType(childrenType);
};
exports.map = map;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.map = exports.QuickMap = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const snapshot_1 = require("./snapshot");
const symbols_1 = require("./symbols");
class QuickMap extends Map {
    static get [Symbol.species]() {
        return Map;
    }
    get [Symbol.toStringTag]() {
        return "Map";
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
    instantiate(snapshot, context) {
        const map = new QuickMap();
        if (snapshot) {
            for (const key in snapshot) {
                const item = this.childrenType.instantiate(snapshot[key], context);
                (0, base_1.setParent)(item, map);
                map.set(key, item);
            }
        }
        (0, base_1.setType)(map, this);
        return map;
    }
}
const map = (childrenType) => {
    return new MapType(childrenType);
};
exports.map = map;

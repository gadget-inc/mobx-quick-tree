"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.literal = exports.LiteralType = exports.NullType = exports.IntegerType = exports.DateType = exports.SimpleType = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
class SimpleType extends base_1.BaseType {
    static for(expectedType, mstType) {
        return new SimpleType(expectedType, mstType);
    }
    constructor(expectedType, mstType) {
        super(mstType);
        this.expectedType = expectedType;
    }
    instantiate(snapshot, _context, _parent) {
        if (snapshot === undefined) {
            throw new Error(`can't initialize simple type ${this.name} with undefined`);
        }
        return snapshot;
    }
    is(value) {
        return typeof value == this.expectedType;
    }
    async schemaHash() {
        return `simple:${this.expectedType}`;
    }
}
exports.SimpleType = SimpleType;
class DateType extends base_1.BaseType {
    instantiate(snapshot, _context, _parent) {
        if (snapshot === undefined) {
            throw new Error(`can't initialize simple type ${this.name} with undefined`);
        }
        return new Date(snapshot);
    }
    is(value) {
        return typeof value == "number" || value instanceof Date;
    }
    async schemaHash() {
        return `date`;
    }
}
exports.DateType = DateType;
class IntegerType extends base_1.BaseType {
    constructor() {
        super(mobx_state_tree_1.types.integer);
    }
    instantiate(snapshot, _context, _parent) {
        if (!Number.isInteger(snapshot)) {
            throw new Error(`can't initialize integer with ${snapshot}`);
        }
        return snapshot;
    }
    is(value) {
        return Number.isInteger(value);
    }
    async schemaHash() {
        return `integer`;
    }
}
exports.IntegerType = IntegerType;
class NullType extends base_1.BaseType {
    constructor() {
        super(mobx_state_tree_1.types.null);
    }
    instantiate(snapshot, _context, _parent) {
        if (snapshot !== null) {
            throw new Error(`can't initialize null with ${snapshot}`);
        }
        return null;
    }
    is(value) {
        return value === null;
    }
    async schemaHash() {
        return `null`;
    }
}
exports.NullType = NullType;
class LiteralType extends SimpleType {
    constructor(value) {
        super(typeof value, mobx_state_tree_1.types.literal(value));
        this.value = value;
    }
    instantiate(snapshot, _context, _parent) {
        if (snapshot !== this.value) {
            throw new Error(`expected literal type to be initialized with ${this.value}`);
        }
        return this.value;
    }
    is(value) {
        return value === this.value;
    }
}
exports.LiteralType = LiteralType;
const literal = (value) => {
    return new LiteralType(value);
};
exports.literal = literal;

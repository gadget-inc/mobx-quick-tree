"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReferenceType = exports.isModelType = exports.isMapType = exports.isArrayType = exports.onSnapshot = exports.applySnapshot = exports.resolveIdentifier = exports.isRoot = exports.getRoot = exports.getEnv = exports.getType = exports.getParentOfType = exports.getParent = exports.isReadOnlyNode = exports.isStateTreeNode = exports.isType = exports.getSnapshot = exports.volatileAction = exports.volatile = exports.view = exports.register = exports.extend = exports.action = exports.ClassModel = exports.walk = exports.unescapeJsonPath = exports.typecheck = exports.tryReference = exports.splitJsonPath = exports.setLivelinessChecking = exports.resolvePath = exports.recordPatches = exports.onPatch = exports.onAction = exports.joinJsonPath = exports.isValidReference = exports.isAlive = exports.isActionContextThisOrChildOf = exports.hasParent = exports.getPathParts = exports.getPath = exports.getIdentifier = exports.escapeJsonPath = exports.detach = exports.destroy = exports.createActionTrackingMiddleware2 = exports.clone = exports.applyPatch = exports.addMiddleware = exports.addDisposer = void 0;
exports.flow = exports.cast = exports.isIdentifierType = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const errors_1 = require("./errors");
const symbols_1 = require("./symbols");
var mobx_state_tree_2 = require("mobx-state-tree");
Object.defineProperty(exports, "addDisposer", { enumerable: true, get: function () { return mobx_state_tree_2.addDisposer; } });
Object.defineProperty(exports, "addMiddleware", { enumerable: true, get: function () { return mobx_state_tree_2.addMiddleware; } });
Object.defineProperty(exports, "applyPatch", { enumerable: true, get: function () { return mobx_state_tree_2.applyPatch; } });
Object.defineProperty(exports, "clone", { enumerable: true, get: function () { return mobx_state_tree_2.clone; } });
Object.defineProperty(exports, "createActionTrackingMiddleware2", { enumerable: true, get: function () { return mobx_state_tree_2.createActionTrackingMiddleware2; } });
Object.defineProperty(exports, "destroy", { enumerable: true, get: function () { return mobx_state_tree_2.destroy; } });
Object.defineProperty(exports, "detach", { enumerable: true, get: function () { return mobx_state_tree_2.detach; } });
Object.defineProperty(exports, "escapeJsonPath", { enumerable: true, get: function () { return mobx_state_tree_2.escapeJsonPath; } });
Object.defineProperty(exports, "getIdentifier", { enumerable: true, get: function () { return mobx_state_tree_2.getIdentifier; } });
Object.defineProperty(exports, "getPath", { enumerable: true, get: function () { return mobx_state_tree_2.getPath; } });
Object.defineProperty(exports, "getPathParts", { enumerable: true, get: function () { return mobx_state_tree_2.getPathParts; } });
Object.defineProperty(exports, "hasParent", { enumerable: true, get: function () { return mobx_state_tree_2.hasParent; } });
Object.defineProperty(exports, "isActionContextThisOrChildOf", { enumerable: true, get: function () { return mobx_state_tree_2.isActionContextThisOrChildOf; } });
Object.defineProperty(exports, "isAlive", { enumerable: true, get: function () { return mobx_state_tree_2.isAlive; } });
Object.defineProperty(exports, "isValidReference", { enumerable: true, get: function () { return mobx_state_tree_2.isValidReference; } });
Object.defineProperty(exports, "joinJsonPath", { enumerable: true, get: function () { return mobx_state_tree_2.joinJsonPath; } });
Object.defineProperty(exports, "onAction", { enumerable: true, get: function () { return mobx_state_tree_2.onAction; } });
Object.defineProperty(exports, "onPatch", { enumerable: true, get: function () { return mobx_state_tree_2.onPatch; } });
Object.defineProperty(exports, "recordPatches", { enumerable: true, get: function () { return mobx_state_tree_2.recordPatches; } });
Object.defineProperty(exports, "resolvePath", { enumerable: true, get: function () { return mobx_state_tree_2.resolvePath; } });
Object.defineProperty(exports, "setLivelinessChecking", { enumerable: true, get: function () { return mobx_state_tree_2.setLivelinessChecking; } });
Object.defineProperty(exports, "splitJsonPath", { enumerable: true, get: function () { return mobx_state_tree_2.splitJsonPath; } });
Object.defineProperty(exports, "tryReference", { enumerable: true, get: function () { return mobx_state_tree_2.tryReference; } });
Object.defineProperty(exports, "typecheck", { enumerable: true, get: function () { return mobx_state_tree_2.typecheck; } });
Object.defineProperty(exports, "unescapeJsonPath", { enumerable: true, get: function () { return mobx_state_tree_2.unescapeJsonPath; } });
Object.defineProperty(exports, "walk", { enumerable: true, get: function () { return mobx_state_tree_2.walk; } });
var class_model_1 = require("./class-model");
Object.defineProperty(exports, "ClassModel", { enumerable: true, get: function () { return class_model_1.ClassModel; } });
Object.defineProperty(exports, "action", { enumerable: true, get: function () { return class_model_1.action; } });
Object.defineProperty(exports, "extend", { enumerable: true, get: function () { return class_model_1.extend; } });
Object.defineProperty(exports, "register", { enumerable: true, get: function () { return class_model_1.register; } });
Object.defineProperty(exports, "view", { enumerable: true, get: function () { return class_model_1.view; } });
Object.defineProperty(exports, "volatile", { enumerable: true, get: function () { return class_model_1.volatile; } });
Object.defineProperty(exports, "volatileAction", { enumerable: true, get: function () { return class_model_1.volatileAction; } });
var snapshot_1 = require("./snapshot");
Object.defineProperty(exports, "getSnapshot", { enumerable: true, get: function () { return snapshot_1.getSnapshot; } });
const isType = (value) => {
    return symbols_1.$quickType in value;
};
exports.isType = isType;
/**
 * Returns true if the given object is a complex type in observable mode
 * @param value any object
 * @returns
 */
const isStateTreeNode = (value) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return true;
    }
    return typeof value === "object" && value !== null && symbols_1.$type in value;
};
exports.isStateTreeNode = isStateTreeNode;
/**
 * Returns true if the given object is a complex type in readonly mode
 * @param value any object
 * @returns
 */
const isReadOnlyNode = (value) => {
    return typeof value === "object" && value !== null && symbols_1.$readOnly in value;
};
exports.isReadOnlyNode = isReadOnlyNode;
const getParent = (value, depth = 1) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.getParent)(value, depth);
    }
    while (value && depth > 0) {
        value = value[symbols_1.$parent];
        depth -= 1;
    }
    if (!value) {
        throw new Error("failed to get parent");
    }
    return value;
};
exports.getParent = getParent;
function getParentOfType(value, type) {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        if ((0, mobx_state_tree_1.isType)(type)) {
            return (0, mobx_state_tree_1.getParentOfType)(value, type);
        }
        else {
            return (0, mobx_state_tree_1.getParentOfType)(value, type.mstType);
        }
    }
    value = value[symbols_1.$parent];
    while (value) {
        if (type.is(value)) {
            break;
        }
        value = value[symbols_1.$parent];
    }
    if (!value) {
        throw new Error("failed to get parent");
    }
    return value;
}
exports.getParentOfType = getParentOfType;
function getType(value) {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.getType)(value);
    }
    return value[symbols_1.$type];
}
exports.getType = getType;
function getEnv(value) {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.getEnv)(value);
    }
    // Assumes no cycles, otherwise this is an infinite loop
    let currentNode = value;
    while (currentNode) {
        const env = currentNode[symbols_1.$env];
        if (env !== undefined) {
            return env;
        }
        currentNode = currentNode[symbols_1.$parent];
    }
    return {};
}
exports.getEnv = getEnv;
const getRoot = (value) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.getRoot)(value);
    }
    // Assumes no cycles, otherwise this is an infinite loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const newValue = value[symbols_1.$parent];
        if (newValue) {
            value = newValue;
        }
        else {
            return value;
        }
    }
};
exports.getRoot = getRoot;
const isRoot = (value) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.isRoot)(value);
    }
    return !value[symbols_1.$parent];
};
exports.isRoot = isRoot;
function resolveIdentifier(type, target, identifier) {
    if ((0, mobx_state_tree_1.isStateTreeNode)(target)) {
        if ((0, exports.isType)(type)) {
            return (0, mobx_state_tree_1.resolveIdentifier)(type.mstType, target, identifier);
        }
        else {
            return (0, mobx_state_tree_1.resolveIdentifier)(type, target, identifier);
        }
    }
    throw new Error("not yet implemented");
}
exports.resolveIdentifier = resolveIdentifier;
const applySnapshot = (target, snapshot) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(target)) {
        (0, mobx_state_tree_1.applySnapshot)(target, snapshot);
        return;
    }
    throw new Error("can't apply a snapshot to a mobx-quick-tree node");
};
exports.applySnapshot = applySnapshot;
const onSnapshot = (target, callback) => {
    if ((0, mobx_state_tree_1.isStateTreeNode)(target)) {
        return (0, mobx_state_tree_1.onSnapshot)(target, callback);
    }
    throw new Error("can't use onSnapshot with a mobx-quick-tree node");
};
exports.onSnapshot = onSnapshot;
const isArrayType = (value) => {
    if ((0, mobx_state_tree_1.isType)(value)) {
        return (0, mobx_state_tree_1.isArrayType)(value);
    }
    return (0, mobx_state_tree_1.isArrayType)(value.mstType);
};
exports.isArrayType = isArrayType;
const isMapType = (value) => {
    if ((0, mobx_state_tree_1.isType)(value)) {
        return (0, mobx_state_tree_1.isMapType)(value);
    }
    return (0, mobx_state_tree_1.isMapType)(value.mstType);
};
exports.isMapType = isMapType;
const isModelType = (value) => {
    if ((0, mobx_state_tree_1.isType)(value)) {
        return (0, mobx_state_tree_1.isModelType)(value);
    }
    return (0, mobx_state_tree_1.isModelType)(value.mstType);
};
exports.isModelType = isModelType;
const isReferenceType = (value) => {
    if ((0, mobx_state_tree_1.isType)(value)) {
        return (0, mobx_state_tree_1.isReferenceType)(value);
    }
    return (0, mobx_state_tree_1.isReferenceType)(value.mstType);
};
exports.isReferenceType = isReferenceType;
const isIdentifierType = (value) => {
    if ((0, mobx_state_tree_1.isType)(value)) {
        return (0, mobx_state_tree_1.isIdentifierType)(value);
    }
    return (0, mobx_state_tree_1.isIdentifierType)(value.mstType);
};
exports.isIdentifierType = isIdentifierType;
function cast(snapshotOrInstance) {
    return snapshotOrInstance;
}
exports.cast = cast;
/**
 * Defines a new asynchronous action. `mobx-quick-tree` (and `mobx-state-tree`) require this wrapper around asynchronous actions, and require those action functions to be generators using `yield` instead of `await`.
 *
 * Accepts an incoming generator function and returns a new async function with the right mobx-state-tree wrapping.
 * See https://mobx-state-tree.js.org/concepts/async-actions for more info.
 */
function flow(generator) {
    // wrap the passed generator in a function which restores the correct value of `this`
    const wrappedGenerator = (0, mobx_state_tree_1.flow)(function* (args, instance) {
        return yield* generator.call(instance, ...args);
    });
    // return an async function to set on the prototype which ensures the instance is not readonly
    return async function (...args) {
        if (this?.constructor?.isMQTClassModel) {
            throw new errors_1.CantRunActionError(`Can't run flow action for a readonly instance`);
        }
        return await wrappedGenerator(args, this);
    };
}
exports.flow = flow;

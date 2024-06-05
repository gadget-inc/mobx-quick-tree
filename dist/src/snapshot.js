"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeViewOnSnapshot = exports.getSnapshot = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const api_1 = require("./api");
const array_1 = require("./array");
const map_1 = require("./map");
const symbols_1 = require("./symbols");
function getSnapshot(value) {
    if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
        return (0, mobx_state_tree_1.getSnapshot)(value);
    }
    return snapshot(value);
}
exports.getSnapshot = getSnapshot;
const snapshot = (value) => {
    if (value instanceof array_1.QuickArray) {
        const type = (0, api_1.getType)(value);
        const childrenAreReferences = (0, api_1.isReferenceType)(type.childrenType);
        return Array.from(value.map((v) => (childrenAreReferences ? v[symbols_1.$identifier] : snapshot(v))));
    }
    if (value instanceof map_1.QuickMap) {
        const type = (0, api_1.getType)(value);
        const childrenAreReferences = (0, api_1.isReferenceType)(type.childrenType);
        return Object.fromEntries(Array.from(value.entries()).map(([k, v]) => {
            return [k, childrenAreReferences ? v[symbols_1.$identifier] : snapshot(v)];
        }));
    }
    if (value instanceof Date) {
        return value.getTime();
    }
    if ((0, api_1.isStateTreeNode)(value)) {
        const type = (0, api_1.getType)(value);
        if ((0, api_1.isModelType)(type)) {
            const modelSnapshot = {};
            for (const name in type.properties) {
                const propType = type.properties[name];
                if ((0, api_1.isReferenceType)(propType)) {
                    const maybeRef = value[name];
                    modelSnapshot[name] = maybeRef?.[symbols_1.$identifier];
                }
                else {
                    modelSnapshot[name] = snapshot(value[name]);
                }
            }
            if ("snapshottedViews" in type) {
                for (const view of type.snapshottedViews) {
                    (0, exports.storeViewOnSnapshot)(value, view, modelSnapshot);
                }
            }
            return modelSnapshot;
        }
    }
    return value;
};
/** @internal */
const storeViewOnSnapshot = (node, view, snapshot) => {
    let value = node[view.property];
    if (view.options.getSnapshot) {
        value = view.options.getSnapshot(value, snapshot, node);
    }
    snapshot[view.property] = value;
};
exports.storeViewOnSnapshot = storeViewOnSnapshot;

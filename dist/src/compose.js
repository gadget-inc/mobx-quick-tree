"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compose = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const model_1 = require("./model");
const compose = (nameOrType, ...types) => {
    let name = undefined;
    if (typeof nameOrType == "string") {
        name = nameOrType;
    }
    else {
        types.unshift(nameOrType);
        name = nameOrType.name;
    }
    const props = types.reduce((props, model) => ({ ...props, ...model.properties }), {});
    const initializers = types.reduce((inits, model) => model.initializers.concat(inits), []);
    // We ignore the overloading MST has put on compose, to avoid writing out an annoying `switch`
    const mstComposedModel = mobx_state_tree_1.types.compose(name, ...types.map((t) => t.mstType));
    // TODO see if there's a good way to not have to do this cast
    return new model_1.ModelType(props, initializers, mstComposedModel);
};
exports.compose = compose;

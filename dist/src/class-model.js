"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClassModel = exports.ensureRegistered = exports.extend = exports.volatile = exports.cachedView = exports.view = exports.volatileAction = exports.action = exports.register = exports.ClassModel = void 0;
const lodash_memoize_1 = __importDefault(require("lodash.memoize"));
const mobx_state_tree_1 = require("mobx-state-tree");
require("reflect-metadata");
const errors_1 = require("./errors");
const fast_instantiator_1 = require("./fast-instantiator");
const model_1 = require("./model");
const symbols_1 = require("./symbols");
const utils_1 = require("./utils");
const metadataPrefix = "mqt:properties";
const viewKeyPrefix = `${metadataPrefix}:view`;
const actionKeyPrefix = `${metadataPrefix}:action`;
const volatileKeyPrefix = `${metadataPrefix}:volatile`;
/**
 * The base-most parent class of all class models.
 **/
class BaseClassModel {
    static extend(props) {
        return extend(this, props);
    }
}
_a = symbols_1.$requiresRegistration, _b = symbols_1.$quickType;
BaseClassModel.isMQTClassModel = true;
BaseClassModel[_a] = true;
BaseClassModel[_b] = true;
/**
 * Create a new base class for a ClassModel to extend. This is a function that you call that returns a class (a class factory).
 *
 * @example
 *
 * class MyModel extends ClassModel({ name: types.string }) {
 *   get upperCasedName() {
 *     return this.name.toUpperCase();
 *   }
 *
 *   @action
 *   setName(name: string) {
 *     this.name = name;
 *   }
 * }
 */
const ClassModel = (propertiesDeclaration) => {
    var _c;
    const props = (0, model_1.propsFromModelPropsDeclaration)(propertiesDeclaration);
    return _c = class extends BaseClassModel {
        },
        _c.properties = props,
        _c;
};
exports.ClassModel = ClassModel;
/**
 * Class decorator for registering MQT class models as setup.
 *
 * @example
 * ```
 *   @register
 *   class Example extends ClassModel({ name: types.string }) {
 *     get bigName() {
 *       return this.name.toUpperCase();
 *     }
 *   }
 * ```
 */
function register(object, tags, name) {
    let klass = object;
    const mstActions = {};
    const mstViews = {};
    const mstVolatiles = {};
    // get the metadata for each property from either the decorators on the class or the explicitly passed tags
    const metadatas = tags ? getExplicitMetadataFromTags(tags) : getReflectionMetadata(klass);
    const explicitKeys = new Set(metadatas.map((metadata) => metadata.property));
    for (const property of allPrototypeFunctionProperties(klass.prototype)) {
        if (explicitKeys.has(property))
            continue;
        metadatas.push({
            type: "view",
            property,
        });
    }
    for (const metadata of metadatas) {
        switch (metadata.type) {
            case "cached-view":
            case "view": {
                const property = metadata.property;
                const descriptor = getPropertyDescriptor(klass.prototype, property);
                if (!descriptor) {
                    throw new errors_1.RegistrationError(`Property ${property} not found on ${klass} prototype, can't register view for class model`);
                }
                if ("cache" in metadata && !descriptor.get) {
                    throw new errors_1.RegistrationError(`Cached view property ${property} on ${klass} must be a getter -- can't use cached views with views that are functions or take arguments`);
                }
                // memoize getters on readonly instances
                if (descriptor.get) {
                    Object.defineProperty(klass.prototype, property, {
                        ...descriptor,
                        get() {
                            if (!this[symbols_1.$readOnly])
                                return descriptor.get.call(this);
                            if (this[symbols_1.$memoizedKeys]?.[property])
                                return this[symbols_1.$memos][property];
                            this[symbols_1.$memoizedKeys] ?? (this[symbols_1.$memoizedKeys] = {});
                            this[symbols_1.$memos] ?? (this[symbols_1.$memos] = {});
                            const value = descriptor.get.call(this);
                            this[symbols_1.$memoizedKeys][property] = true;
                            this[symbols_1.$memos][property] = value;
                            return value;
                        },
                    });
                }
                Object.defineProperty(mstViews, property, {
                    ...descriptor,
                    enumerable: true,
                });
                break;
            }
            case "action": {
                let target;
                const canUsePrototype = metadata.property in klass.prototype;
                if (canUsePrototype) {
                    target = klass.prototype;
                }
                else {
                    // hackily instantiate the class to get at the instance level properties defined by the class body (those that aren't on the prototype)
                    target = new klass({}, {}, null, true);
                }
                const descriptor = getPropertyDescriptor(target, metadata.property);
                if (!descriptor) {
                    throw new errors_1.RegistrationError(`Property ${metadata.property} not found on ${klass} prototype or instance, can't register action for class model. Using ${canUsePrototype ? "prototype" : "instance"} to inspect.`);
                }
                let actionFunction = descriptor.value;
                if (actionFunction[symbols_1.$originalDescriptor]) {
                    actionFunction = actionFunction[symbols_1.$originalDescriptor].value;
                }
                if (!actionFunction || !actionFunction.call) {
                    throw new errors_1.RegistrationError(`Property ${metadata.property} found on ${klass} but can't be registered as an action because it isn't a function. It is ${actionFunction}.`);
                }
                // add the action to the MST actions we'll add to the MST model type
                Object.defineProperty(mstActions, metadata.property, {
                    ...descriptor,
                    value: actionFunction,
                    enumerable: true,
                });
                if (!metadata.volatile) {
                    // overwrite the action on the readonly class to throw when called (it's readonly!)
                    Object.defineProperty(klass.prototype, metadata.property, {
                        ...descriptor,
                        enumerable: true,
                        value: (0, model_1.defaultThrowAction)(metadata.property, descriptor),
                    });
                }
                else {
                    // for volatile actions, leave the action as-is on the readonly class prototype so that it can still be run
                }
                break;
            }
            case "volatile": {
                mstVolatiles[metadata.property] = metadata;
                break;
            }
        }
    }
    if (name) {
        Object.defineProperty(klass, "name", { value: name });
    }
    klass.volatiles = mstVolatiles;
    // conform to the API that the other MQT types expect for creating instances
    klass.create = (snapshot, env) => klass.mstType.create(snapshot, env);
    klass.schemaHash = (0, lodash_memoize_1.default)(async () => {
        const props = Object.entries(klass.properties).sort(([key1], [key2]) => key1.localeCompare(key2));
        const propHashes = await Promise.all(props.map(async ([key, prop]) => `${key}:${await prop.schemaHash()}`));
        return `model:${klass.name}:${(0, utils_1.cyrb53)(propHashes.join("|"))}`;
    });
    // create the MST type for not-readonly versions of this using the views and actions extracted from the class
    let mstType = mobx_state_tree_1.types
        .model(klass.name, (0, model_1.mstPropsFromQuickProps)(klass.properties))
        .views((self) => bindToSelf(self, mstViews))
        .actions((self) => bindToSelf(self, mstActions));
    if (Object.keys(mstVolatiles).length > 0) {
        // define the volatile properties in one shot by running any passed initializers
        mstType = mstType.volatile((self) => initializeVolatiles({}, self, mstVolatiles));
    }
    const cachedViews = metadatas.filter((metadata) => metadata.type == "cached-view");
    if (cachedViews.length > 0) {
        mstType = mobx_state_tree_1.types.snapshotProcessor(mstType, {
            postProcessor(snapshot, node) {
                const stn = node.$treenode;
                if (stn.state == 2 /** NodeLifeCycle.FINALIZED */) {
                    for (const cachedView of cachedViews) {
                        let value = node[cachedView.property];
                        if (cachedView.cache.getSnapshot) {
                            value = cachedView.cache.getSnapshot(value, snapshot, node);
                        }
                        snapshot[cachedView.property] = value;
                    }
                }
                return snapshot;
            },
        });
    }
    klass.mstType = mstType;
    // define the class constructor and the following hot path functions dynamically
    // .createReadOnly
    // .is
    // .instantiate
    klass = new fast_instantiator_1.InstantiatorBuilder(klass, cachedViews).build();
    klass[symbols_1.$registered] = true;
    return klass;
}
exports.register = register;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
const action = (target, property) => {
    const metadata = { type: "action", property, volatile: false };
    Reflect.defineMetadata(`${actionKeyPrefix}:${property}`, metadata, target);
};
exports.action = action;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
const volatileAction = (target, property) => {
    const metadata = { type: "action", property, volatile: true };
    Reflect.defineMetadata(`${actionKeyPrefix}:${property}`, metadata, target);
};
exports.volatileAction = volatileAction;
/**
 * Function decorator for registering MST views within MQT class models.
 */
const view = (target, property, _descriptor) => {
    const metadata = { type: "view", property };
    Reflect.defineMetadata(`${viewKeyPrefix}:${property}`, metadata, target);
};
exports.view = view;
/**
 * Function decorator for registering MQT cached views within MQT class models. Stores the view's value into the snapshot when an instance is snapshotted, and uses that stored value for readonly instances created from snapshots.
 *
 * Can be passed an `options` object with a `preProcess` and/or `postProcess` function for transforming the cached value stored in the snapshot to and from the snapshot state.
 *
 * @example
 * class Example extends ClassModel({ name: types.string }) {
 *   @cachedView
 *   get slug() {
 *     return this.name.toLowerCase().replace(/ /g, "-");
 *   }
 * }
 *
 * @example
 * class Example extends ClassModel({ timestamp: types.string }) {
 *   @cachedView({ preProcess: (value) => new Date(value), postProcess: (value) => value.toISOString() })
 *   get date() {
 *     return new Date(timestamp).setTime(0);
 *   }
 * }
 */
function cachedView(options = {}) {
    return (target, property, _descriptor) => {
        const metadata = { type: "cached-view", property, cache: options };
        Reflect.defineMetadata(`${viewKeyPrefix}:${property}`, metadata, target);
    };
}
exports.cachedView = cachedView;
/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
function volatile(initializer) {
    return Object.assign((target, property) => {
        const metadata = { type: "volatile", property: property, initializer };
        Reflect.defineMetadata(`${volatileKeyPrefix}:${property}`, metadata, target);
    }, {
        [symbols_1.$volatileDefiner]: true,
        initializer,
    });
}
exports.volatile = volatile;
/**
 * Create a new class model that extends this class model, but with additional props added to the list of observable props.
 */
function extend(klass, props) {
    const subclass = class extends klass {
    };
    subclass.properties = {
        ...klass.properties,
        ...(0, model_1.propsFromModelPropsDeclaration)(props),
    };
    return subclass;
}
exports.extend = extend;
/**
 * Ensure a given type is registered if it requires registration.
 * Throws an error if a type requires registration but has not been registered.
 * @hidden
 */
const ensureRegistered = (type) => {
    let chain = type;
    while (chain) {
        if (chain[symbols_1.$requiresRegistration]) {
            if (!type[symbols_1.$registered]) {
                throw new Error(`Type ${type.name} requires registration but has not been registered yet. Add the @register decorator to it for it to function correctly.`);
            }
            break;
        }
        chain = Object.getPrototypeOf(chain);
    }
};
exports.ensureRegistered = ensureRegistered;
function initializeVolatiles(result, node, volatiles) {
    for (const key in volatiles) {
        result[key] = volatiles[key].initializer(node);
    }
    return result;
}
function bindToSelf(self, inputs) {
    const outputs = {};
    const descriptors = Object.getOwnPropertyDescriptors(inputs);
    for (const key in descriptors) {
        const property = descriptors[key];
        if (typeof property.value === "function") {
            property.value = property.value.bind(self);
        }
        if (typeof property.get === "function") {
            property.get = property.get.bind(self);
        }
        if (typeof property.set === "function") {
            property.set = property.set.bind(self);
        }
        Object.defineProperty(outputs, key, property);
    }
    return outputs;
}
function getExplicitMetadataFromTags(tags) {
    return Object.entries(tags).map(([property, tag]) => {
        if (tag == exports.view) {
            return {
                type: "view",
                property,
            };
        }
        else if (tag == exports.action) {
            return {
                type: "action",
                property,
                volatile: false,
            };
        }
        else if (tag == exports.volatileAction) {
            return {
                type: "action",
                property,
                volatile: true,
            };
        }
        else if (symbols_1.$volatileDefiner in tag) {
            return {
                type: "volatile",
                property,
                initializer: tag.initializer,
            };
        }
        else {
            throw new Error(`Unknown metadata tag for property ${property}: ${tag}`);
        }
    });
}
function getReflectionMetadata(klass) {
    // list all keys defined at the prototype level to search for volatiles and actions
    return Reflect.getMetadataKeys(klass.prototype)
        .filter((key) => key.startsWith(metadataPrefix))
        .map((metadataKey) => Reflect.getMetadata(metadataKey, klass.prototype));
}
const objectPrototype = Object.getPrototypeOf({});
// eslint-disable-next-line @typescript-eslint/no-empty-function
const functionPrototype = Object.getPrototypeOf(() => { });
function allPrototypeFunctionProperties(obj) {
    const properties = new Set();
    let currentObj = obj;
    while (currentObj && currentObj !== objectPrototype && currentObj !== functionPrototype) {
        for (const [property, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(currentObj))) {
            if (typeof descriptor.value === "function" || descriptor.get) {
                properties.add(property);
            }
        }
        currentObj = Object.getPrototypeOf(currentObj);
    }
    return [...properties.keys()].filter((key) => key != "constructor");
}
/**
 * Get the property descriptor for a property from anywhere in the prototype chain
 * Similar to Object.getOwnPropertyDescriptor, but without the own bit
 */
function getPropertyDescriptor(obj, property) {
    while (obj) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, property);
        if (descriptor) {
            return descriptor;
        }
        obj = Object.getPrototypeOf(obj);
    }
    return null;
}
const isClassModel = (type) => {
    return type.isMQTClassModel;
};
exports.isClassModel = isClassModel;

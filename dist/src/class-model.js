"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRegistered = exports.volatile = exports.view = exports.action = exports.register = exports.ClassModel = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
require("reflect-metadata");
const errors_1 = require("./errors");
const model_1 = require("./model");
const symbols_1 = require("./symbols");
const metadataPrefix = "mqt:properties";
const viewKeyPrefix = `${metadataPrefix}:view`;
const actionKeyPrefix = `${metadataPrefix}:action`;
const volatileKeyPrefix = `${metadataPrefix}:volatile`;
/**
 * Create a new base class for a ClassModel to extend. This is a function that you call that returns a class (a class factory).
 *
 * @example
 *
 * class MyModel extends ClassModel({ name: types.string }) {
 *   @view
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
    var _a, _b;
    const props = (0, model_1.propsFromModelPropsDeclaration)(propertiesDeclaration);
    return _b = class Base {
            constructor(attrs, env, context, 
            /** @hidden */ hackyPreventInitialization = false) {
                if (hackyPreventInitialization) {
                    return;
                }
                const klass = this.constructor;
                const isRoot = !context;
                context ?? (context = {
                    referenceCache: new Map(),
                    referencesToResolve: [],
                    env,
                });
                this[symbols_1.$env] = env;
                (0, model_1.instantiateInstanceFromProperties)(this, attrs, props, klass.mstType.identifierAttribute, context);
                initializeVolatiles(this, this, klass.volatiles);
                if (isRoot) {
                    for (const resolver of context.referencesToResolve) {
                        resolver();
                    }
                }
            }
            get [(_a = symbols_1.$requiresRegistration, symbols_1.$readOnly)]() {
                return true;
            }
            get [symbols_1.$type]() {
                return this.constructor;
            }
        },
        _b.isMQTClassModel = true,
        _b.properties = props,
        _b[_a] = true,
        _b;
};
exports.ClassModel = ClassModel;
/**
 * Class decorator for registering MQT class models as setup.
 *
 * @example
 * ```
 *   @register
 *   class Example extends ClassModel({ name: types.string }) {
 *     @view
 *     get bigName() {
 *       return this.name.toUpperCase();
 *     }
 *   }
 * ```
 */
function register(object, tags) {
    const klass = object;
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
            case "view": {
                const descriptor = Object.getOwnPropertyDescriptor(klass.prototype, metadata.property);
                if (!descriptor) {
                    throw new errors_1.RegistrationError(`Property ${metadata.property} not found on ${klass} prototype, can't register view for class model`);
                }
                Object.defineProperty(mstViews, metadata.property, {
                    ...Object.getOwnPropertyDescriptor(klass.prototype, metadata.property),
                    enumerable: true,
                });
                break;
            }
            case "action": {
                let target;
                if (metadata.property in klass.prototype) {
                    target = klass.prototype;
                }
                else {
                    // hackily instantiate the class to get at the instance level properties defined by the class body (those that aren't on the prototype)
                    target = new klass({}, undefined, undefined, true);
                }
                const descriptor = Object.getOwnPropertyDescriptor(target, metadata.property);
                if (!descriptor) {
                    throw new errors_1.RegistrationError(`Property ${metadata.property} not found on ${klass} prototype or instance, can't register action for class model`);
                }
                // add the action to the MST actions we'll add to the MST model type
                Object.defineProperty(mstActions, metadata.property, {
                    ...descriptor,
                    enumerable: true,
                });
                // mark the action as not-runnable on the readonly class
                Object.defineProperty(klass.prototype, metadata.property, {
                    ...descriptor,
                    enumerable: true,
                    value: (0, model_1.defaultThrowAction)(metadata.property),
                });
                break;
            }
            case "volatile": {
                mstVolatiles[metadata.property] = metadata;
            }
        }
    }
    klass.volatiles = mstVolatiles;
    // conform to the API that the other MQT types expect for creating instances
    klass.instantiate = (snapshot, context) => new klass(snapshot, context.env, context);
    klass.is = (value) => value instanceof klass || klass.mstType.is(value);
    klass.create = (snapshot, env) => klass.mstType.create(snapshot, env);
    klass.createReadOnly = (snapshot, env) => new klass(snapshot, env);
    // create the MST type for not-readonly versions of this using the views and actions extracted from the class
    klass.mstType = mobx_state_tree_1.types
        .model(klass.name, (0, model_1.mstPropsFromQuickProps)(klass.properties))
        .views((self) => bindToSelf(self, mstViews))
        .actions((self) => bindToSelf(self, mstActions));
    if (Object.keys(mstVolatiles).length > 0) {
        // define the volatile properties in one shot by running any passed initializers
        klass.mstType = klass.mstType.volatile((self) => initializeVolatiles({}, self, mstVolatiles));
    }
    klass[symbols_1.$registered] = true;
    return klass;
}
exports.register = register;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
const action = (target, property) => {
    const metadata = { type: "action", property };
    Reflect.defineMetadata(`${actionKeyPrefix}:${property}`, metadata, target);
};
exports.action = action;
/**
 * Function decorator for registering MST views within MQT class models.
 */
const view = (target, property, _descriptor) => {
    const metadata = { type: "view", property };
    Reflect.defineMetadata(`${viewKeyPrefix}:${property}`, metadata, target);
};
exports.view = view;
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
    for (const [key, metadata] of Object.entries(volatiles)) {
        result[key] = metadata.initializer(node);
    }
    return result;
}
function bindToSelf(self, inputs) {
    const outputs = {};
    for (const [key, property] of Object.entries(Object.getOwnPropertyDescriptors(inputs))) {
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

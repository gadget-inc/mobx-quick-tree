"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRegistered = exports.volatile = exports.view = exports.action = exports.register = exports.ClassModel = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
require("reflect-metadata");
const base_1 = require("./base");
const model_1 = require("./model");
const symbols_1 = require("./symbols");
const kClassModelPropertyMetadata = Symbol.for("mqt:class-model-property-metadata");
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
            constructor(attrs, env, readonly = false, context) {
                const mstType = this.constructor.mstType;
                if (readonly) {
                    const isRoot = !context;
                    context ?? (context = {
                        referenceCache: new Map(),
                        referencesToResolve: [],
                        env,
                    });
                    (0, base_1.setType)(this, this.constructor);
                    (0, base_1.setEnv)(this, context.env);
                    (0, model_1.instantiateInstanceFromProperties)(this, attrs, props, mstType.identifierAttribute, context);
                    if (isRoot) {
                        for (const resolver of context.referencesToResolve) {
                            resolver();
                        }
                    }
                }
                else {
                    return mstType.create(attrs);
                }
            }
        },
        _a = symbols_1.$requiresRegistration,
        _b.isMQTClassModel = true,
        _b.properties = props,
        _b[_a] = true,
        _b;
};
exports.ClassModel = ClassModel;
/**
 * Class decorator for registering MQT class models as setup.
 */
function register(object) {
    const klass = object;
    const mstActions = {};
    const mstViews = {};
    for (const [key, property] of Object.entries(Object.getOwnPropertyDescriptors(klass.prototype))) {
        const metadata = Reflect.getMetadata(kClassModelPropertyMetadata, klass.prototype, key);
        if (metadata) {
            switch (metadata.type) {
                case "action":
                    // add the action to the MST actions we'll add to the MST model type
                    Object.defineProperty(mstActions, key, {
                        ...property,
                        enumerable: true,
                    });
                    // mark the action as not-runnable on the readonly class
                    Object.defineProperty(klass.prototype, key, {
                        ...property,
                        enumerable: true,
                        value: (0, model_1.defaultThrowAction)(key),
                    });
                    break;
                case "view":
                    Object.defineProperty(mstViews, key, {
                        ...property,
                        enumerable: true,
                    });
                    break;
                case "volatile":
                    // TODO
                    break;
            }
        }
    }
    // conform to the API that the other MQT types expect for creating instances
    klass.instantiate = (snapshot, context) => {
        return new klass(snapshot, context.env, true, context);
    };
    klass.is = (value) => value instanceof klass || klass.mstType.is(value);
    klass.create = (snapshot, env) => klass.mstType.create(snapshot, env);
    klass.createReadOnly = (snapshot, env) => new klass(snapshot, env, true);
    // create the MST type for not-readonly versions of this using the views and actions extracted from the class
    klass.mstType = mobx_state_tree_1.types
        .model(klass.name, (0, model_1.mstPropsFromQuickProps)(klass.properties))
        .views((self) => bindToSelf(self, mstViews))
        .actions((self) => bindToSelf(self, mstActions));
    klass.prototype[symbols_1.$type] = klass;
    klass[symbols_1.$registered] = true;
    return klass;
}
exports.register = register;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
const action = (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "action" }, target, propertyKey);
};
exports.action = action;
/**
 * Function decorator for registering MST views within MQT class models.
 */
const view = (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "view" }, target, propertyKey);
};
exports.view = view;
/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
const volatile = (target, propertyKey, _descriptor) => {
    Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "volatile" }, target, propertyKey);
};
exports.volatile = volatile;
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

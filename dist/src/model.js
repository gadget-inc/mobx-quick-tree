"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = exports.ModelType = exports.defaultThrowAction = exports.instantiateInstanceFromProperties = exports.mstPropsFromQuickProps = exports.propsFromModelPropsDeclaration = void 0;
const lodash_memoize_1 = __importDefault(require("lodash.memoize"));
const mobx_state_tree_1 = require("mobx-state-tree");
const _1 = require(".");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const errors_1 = require("./errors");
const symbols_1 = require("./symbols");
const utils_1 = require("./utils");
const propsFromModelPropsDeclaration = (propsDecl) => {
    const props = {};
    for (const name in propsDecl) {
        const value = propsDecl[name];
        switch (typeof value) {
            case "string":
                props[name] = _1.types.optional(_1.types.string, value);
                break;
            case "boolean":
                props[name] = _1.types.optional(_1.types.boolean, value);
                break;
            case "number":
                props[name] = _1.types.optional(_1.types.number, value);
                break;
            default:
                if (value instanceof Date) {
                    props[name] = _1.types.optional(_1.types.Date, value);
                    break;
                }
                (0, class_model_1.ensureRegistered)(value);
                props[name] = value;
                break;
        }
    }
    return props;
};
exports.propsFromModelPropsDeclaration = propsFromModelPropsDeclaration;
const mstPropsFromQuickProps = (props) => {
    const mstProps = {};
    for (const name in props) {
        mstProps[name] = props[name].mstType;
    }
    return mstProps;
};
exports.mstPropsFromQuickProps = mstPropsFromQuickProps;
const assignProps = (target, source) => {
    if (target && source) {
        const descriptors = Object.getOwnPropertyDescriptors(source);
        for (const name in descriptors) {
            const desc = descriptors[name];
            const getter = desc.get;
            if (getter) {
                let cached = false;
                let cachedValue;
                Object.defineProperty(target, name, {
                    get() {
                        if (cached)
                            return cachedValue;
                        cachedValue = getter.apply(target);
                        cached = true;
                        return cachedValue;
                    },
                    configurable: true,
                });
            }
            else {
                target[name] = desc.value;
            }
        }
    }
};
const instantiateInstanceFromProperties = (instance, snapshot, properties, identifierProp, context) => {
    for (const propName in properties) {
        const propType = properties[propName];
        if ((0, mobx_state_tree_1.isReferenceType)(propType.mstType)) {
            context.referencesToResolve.push(() => {
                instance[propName] = propType.instantiate(snapshot?.[propName], context, instance);
            });
            continue;
        }
        instance[propName] = propType.instantiate(snapshot?.[propName], context, instance);
    }
    if (identifierProp) {
        const id = instance[identifierProp];
        instance[symbols_1.$identifier] = id;
        context.referenceCache.set(id, instance);
    }
};
exports.instantiateInstanceFromProperties = instantiateInstanceFromProperties;
const defaultThrowAction = (name, originalDescriptor) => {
    const overriddenThrowAction = () => {
        throw new errors_1.CantRunActionError(`Can't run action "${name}" for a readonly instance`);
    };
    overriddenThrowAction[symbols_1.$originalDescriptor] = originalDescriptor;
    return overriddenThrowAction;
};
exports.defaultThrowAction = defaultThrowAction;
const DEFAULT_PROTOTYPE = {};
class ModelType extends base_1.BaseType {
    constructor(properties, initializers, mstType, prototype) {
        super(mstType);
        this.properties = properties;
        this.initializers = initializers;
        this.schemaHash = (0, lodash_memoize_1.default)(async () => {
            const props = Object.entries(this.properties).sort(([key1], [key2]) => key1.localeCompare(key2));
            const propHashes = await Promise.all(props.map(async ([key, prop]) => `${key}:${await prop.schemaHash()}`));
            return `model:${this.name}:${(0, utils_1.cyrb53)(propHashes.join("|"))}`;
        });
        Object.defineProperty(this, "mstType", {
            value: mstType,
            enumerable: false,
            writable: false,
            configurable: false,
        });
        this.identifierProp = this.mstType.identifierAttribute;
        this.prototype = Object.create(prototype ?? null, {
            [symbols_1.$type]: {
                value: this,
                configurable: false,
                enumerable: false,
                writable: false,
            },
            [symbols_1.$parent]: {
                value: null,
                configurable: false,
                enumerable: false,
                writable: true,
            },
            [symbols_1.$context]: {
                value: null,
                configurable: false,
                enumerable: false,
                writable: true,
            },
            [symbols_1.$readOnly]: {
                value: true,
                configurable: false,
                enumerable: false,
                writable: false,
            },
        });
    }
    views(fn) {
        const init = (self) => assignProps(self, fn(self));
        return new ModelType(this.properties, [...this.initializers, init], this.mstType.views(fn), this.prototype);
    }
    actions(fn) {
        const prototype = Object.create(this.prototype);
        const actions = fn(null); // assumes action blocks are never referencing `self` during instantiation
        for (const name of Object.keys(actions)) {
            prototype[name] = (0, exports.defaultThrowAction)(name);
        }
        return new ModelType(this.properties, this.initializers, this.mstType.actions(fn), prototype);
    }
    props(propsDecl) {
        const props = (0, exports.propsFromModelPropsDeclaration)(propsDecl);
        return new ModelType({ ...this.properties, ...props }, this.initializers, this.mstType.props((0, exports.mstPropsFromQuickProps)(props)), this.prototype);
    }
    named(newName) {
        return new ModelType(this.properties, this.initializers, this.mstType.named(newName));
    }
    volatile(fn) {
        const init = (self) => assignProps(self, fn(self));
        return new ModelType(this.properties, [...this.initializers, init], this.mstType.volatile(fn));
    }
    extend(fn) {
        const init = (self) => {
            const result = fn(self);
            assignProps(self, result.views);
            assignProps(self, result.state);
            assignProps(self, result.actions);
        };
        return new ModelType(this.properties, [...this.initializers, init], this.mstType.extend(fn));
    }
    is(value) {
        if (typeof value !== "object" || value === null) {
            return false;
        }
        if (value[symbols_1.$type] === this) {
            return true;
        }
        if ((0, mobx_state_tree_1.isStateTreeNode)(value)) {
            return this.mstType.is(value);
        }
        if (Object.getPrototypeOf(value) !== Object.prototype) {
            return false;
        }
        for (const name in this.properties) {
            if (!this.properties[name].is(value[name])) {
                return false;
            }
        }
        return true;
    }
    instantiate(snapshot, context, parent) {
        const instance = Object.create(this.prototype, {
            [symbols_1.$parent]: {
                value: parent,
                enumerable: false,
                configurable: false,
                writable: false,
            },
            [symbols_1.$context]: {
                value: context,
                enumerable: false,
                configurable: false,
                writable: false,
            },
        });
        (0, exports.instantiateInstanceFromProperties)(instance, snapshot, this.properties, this.identifierProp, context);
        for (let index = 0; index < this.initializers.length; index++) {
            this.initializers[index](instance);
        }
        return instance;
    }
}
exports.ModelType = ModelType;
const model = (nameOrProperties, properties) => {
    let propsDecl;
    let name = "model";
    if (typeof nameOrProperties === "string") {
        name = nameOrProperties;
        propsDecl = properties ?? {};
    }
    else {
        propsDecl = nameOrProperties ?? {};
    }
    const props = (0, exports.propsFromModelPropsDeclaration)(propsDecl);
    return new ModelType(props, [], mobx_state_tree_1.types.model(name, (0, exports.mstPropsFromQuickProps)(props)));
};
exports.model = model;

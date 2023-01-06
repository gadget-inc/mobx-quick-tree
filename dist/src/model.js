"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = exports.ModelType = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const _1 = require(".");
const base_1 = require("./base");
const errors_1 = require("./errors");
const symbols_1 = require("./symbols");
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
                props[name] = value;
                break;
        }
    }
    return props;
};
const mstPropsFromQuickProps = (props) => {
    const mstProps = {};
    for (const name in props) {
        mstProps[name] = props[name].mstType;
    }
    return mstProps;
};
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
const defaultThrowAction = (name) => {
    return () => {
        throw new errors_1.CantRunActionError(`Can't run action "${name}" for a readonly instance`);
    };
};
class ModelType extends base_1.BaseType {
    constructor(properties, initializers, mstType, prototype) {
        super(mstType);
        this.properties = properties;
        this.initializers = initializers;
        this.identifierProp = this.mstType.identifierAttribute;
        if (prototype) {
            this.prototype = Object.create(prototype);
        }
        else {
            this.prototype = {};
        }
        (0, base_1.setType)(this.prototype, this);
    }
    views(fn) {
        const init = (self) => assignProps(self, fn(self));
        return new ModelType(this.properties, [...this.initializers, init], this.mstType.views(fn), this.prototype);
    }
    actions(fn) {
        const prototype = Object.create(this.prototype);
        const actions = fn(null); // assumes action blocks are never referencing `self` during instantiation
        for (const name of Object.keys(actions)) {
            prototype[name] = defaultThrowAction(name);
        }
        return new ModelType(this.properties, this.initializers, this.mstType.actions(fn), prototype);
    }
    props(propsDecl) {
        const props = propsFromModelPropsDeclaration(propsDecl);
        return new ModelType({ ...this.properties, ...props }, this.initializers, this.mstType.props(mstPropsFromQuickProps(props)), this.prototype);
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
    instantiate(snapshot, context) {
        const instance = Object.create(this.prototype);
        for (const propName in this.properties) {
            const propType = this.properties[propName];
            if ((0, mobx_state_tree_1.isReferenceType)(propType.mstType)) {
                context.referencesToResolve.push(() => {
                    const propValue = propType.instantiate(snapshot?.[propName], context);
                    instance[propName] = propValue;
                });
                continue;
            }
            const propValue = propType.instantiate(snapshot?.[propName], context);
            (0, base_1.setParent)(propValue, instance);
            instance[propName] = propValue;
        }
        if (this.identifierProp) {
            const id = instance[this.identifierProp];
            instance[symbols_1.$identifier] = id;
            context.referenceCache.set(id, instance);
        }
        for (const init of this.initializers) {
            init(instance);
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
    const props = propsFromModelPropsDeclaration(propsDecl);
    return new ModelType(props, [], mobx_state_tree_1.types.model(name, mstPropsFromQuickProps(props)));
};
exports.model = model;

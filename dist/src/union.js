"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyUnion = exports.union = void 0;
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const optional_1 = require("./optional");
const api_1 = require("./api");
const simple_1 = require("./simple");
const errors_1 = require("./errors");
const emptyContext = {
    referenceCache: new Map(),
    referencesToResolve: [],
};
/**
 * Given a type, get the concrete value that all instances would have at a given `property` at runtime
 **/
const getDiscriminatorPropertyValueForType = (type, property) => {
    if ((0, class_model_1.isClassModel)(type) || (0, api_1.isModelType)(type)) {
        return getDiscriminatorPropertyValueForType(type.properties[property], property);
    }
    else if (type instanceof optional_1.OptionalType) {
        return type.instantiate(undefined, emptyContext);
    }
    else if (type instanceof simple_1.LiteralType) {
        return type.value;
    }
    else {
        throw new errors_1.InvalidDiscriminatorError(`Can't use the discriminator property ${property} on the type ${type} as it is of a type who's value can't be determined at union creation time.`);
    }
};
class UnionType extends base_1.BaseType {
    constructor(types, options = {}) {
        let dispatcher = undefined;
        if (options?.dispatcher) {
            dispatcher = options.dispatcher;
        }
        else if (options?.discriminator) {
            const discriminatorToTypeMap = {};
            for (const type of types) {
                const discriminatorValue = getDiscriminatorPropertyValueForType(type, options.discriminator);
                discriminatorToTypeMap[discriminatorValue] = type;
            }
            dispatcher = (snapshot) => {
                const discriminatorValue = snapshot[options.discriminator];
                let type;
                if (discriminatorValue) {
                    type = discriminatorToTypeMap[discriminatorValue];
                }
                else {
                    // if no discriminator value is present, fallback to the slow way
                    type = types.find((ty) => ty.is(snapshot));
                }
                if (!type) {
                    throw new TypeError(`Discriminator property ${discriminatorValue} on incoming snapshot didn't correspond to a type, snapshot was ${JSON.stringify(snapshot)}`);
                }
                return type;
            };
        }
        super(mobx_state_tree_1.types.union({ ...options, dispatcher: dispatcher ? (snapshot) => dispatcher(snapshot).mstType : undefined }, ...types.map((x) => x.mstType)));
        this.types = types;
        this.options = options;
        this.dispatcher = dispatcher;
    }
    instantiate(snapshot, context) {
        let type;
        if (this.dispatcher) {
            type = this.dispatcher(snapshot);
        }
        else {
            type = this.types.find((ty) => ty.is(snapshot));
        }
        if (!type) {
            // try to get MST's nice error formatting by having it create the object from this snapshot
            this.mstType.create(snapshot);
            // if that doesn't throw, throw our own error
            throw new Error("couldn't find valid type from union for given snapshot");
        }
        return type.instantiate(snapshot, context);
    }
    is(value) {
        return this.types.some((type) => type.is(value));
    }
}
function union(optionsOrType, ...types) {
    let options = undefined;
    if ((0, api_1.isType)(optionsOrType)) {
        types.unshift(optionsOrType);
    }
    else {
        options = optionsOrType;
    }
    types.forEach(class_model_1.ensureRegistered);
    return new UnionType(types, options);
}
exports.union = union;
function lazyUnion(...types) {
    types.forEach(class_model_1.ensureRegistered);
    return new UnionType(types, { eager: false });
}
exports.lazyUnion = lazyUnion;

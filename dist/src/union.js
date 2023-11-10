"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lazyUnion = exports.union = void 0;
const lodash_memoize_1 = __importDefault(require("lodash.memoize"));
const mobx_state_tree_1 = require("mobx-state-tree");
const base_1 = require("./base");
const class_model_1 = require("./class-model");
const optional_1 = require("./optional");
const api_1 = require("./api");
const simple_1 = require("./simple");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
const emptyContext = {
    referenceCache: new Map(),
    referencesToResolve: [],
};
/**
 * Build a map of runtime values to the type that should be constructed for snapshots with that value at the `discriminator` property
 **/
const buildDiscriminatorTypeMap = (types, discriminator) => {
    const map = {};
    const setMapValue = (type, instantiateAsType) => {
        if (type instanceof UnionType) {
            // support nested unions by recursing into their types, using the same discriminator
            for (const innerUnionType of type.types) {
                setMapValue(innerUnionType, innerUnionType);
            }
        }
        else if ((0, class_model_1.isClassModel)(type) || (0, api_1.isModelType)(type)) {
            setMapValue(type.properties[discriminator], instantiateAsType);
        }
        else if (type instanceof optional_1.OptionalType) {
            const value = type.instantiate(undefined, emptyContext, null);
            map[value] = instantiateAsType;
        }
        else if (type instanceof simple_1.LiteralType) {
            map[type.value] = instantiateAsType;
        }
        else {
            throw new errors_1.InvalidDiscriminatorError(`Can't use the discriminator property \`${discriminator}\` on the type \`${type}\` as it is of a type who's value can't be determined at union creation time.`);
        }
    };
    // figure out what the runtime value of the discriminator property is for each type
    for (const type of types) {
        setMapValue(type, type);
    }
    return map;
};
class UnionType extends base_1.BaseType {
    constructor(types, options = {}) {
        let dispatcher = undefined;
        if (options?.dispatcher) {
            dispatcher = options.dispatcher;
        }
        else if (options?.discriminator) {
            const discriminatorToTypeMap = buildDiscriminatorTypeMap(types, options.discriminator);
            // build a dispatcher that looks up the type based on the discriminator value from the snapshot
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
                    throw new TypeError(`Discriminator property value \`${discriminatorValue}\` for property \`${options.discriminator}\` on incoming snapshot didn't correspond to a type. Options: ${Object.keys(discriminatorToTypeMap).join(", ")}. Snapshot was \`${JSON.stringify(snapshot)}\``);
                }
                return type;
            };
        }
        super(mobx_state_tree_1.types.union({ ...options, dispatcher: dispatcher ? (snapshot) => dispatcher(snapshot).mstType : undefined }, ...types.map((x) => x.mstType)));
        this.types = types;
        this.options = options;
        this.schemaHash = (0, lodash_memoize_1.default)(async () => {
            return (0, utils_1.cyrb53)(`union:${(await Promise.all(this.types.map((type) => type.schemaHash()))).join("|")}`).toString();
        });
        this.dispatcher = dispatcher;
    }
    instantiate(snapshot, context, parent) {
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
        return type.instantiate(snapshot, context, parent);
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

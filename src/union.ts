import type { IType, UnionOptions as MSTUnionOptions } from "mobx-state-tree";
import { types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered, isClassModel } from "./class-model";
import type { IAnyType, InstanceWithoutSTNTypeForType, InstantiateContext, IUnionType } from "./types";
import { OptionalType } from "./optional";
import { isModelType, isType } from "./api";
import { LiteralType } from "./simple";
import { InvalidDiscriminatorError } from "./errors";

export type ITypeDispatcher = (snapshot: any) => IAnyType;

export interface UnionOptions extends Omit<MSTUnionOptions, "dispatcher"> {
  /**
   * Instantiating unions can be kind of slow in general as we have to test each of the possible types against an incoming snapshot
   *
   * For quickly looking up which of the union types is the correct one for an incoming snapshot, you can set this to one of the properties that is present on all the incoming types, and union instantiation will use it to avoid the type scan.
   **/
  discriminator?: string;

  /** Function for customizing the union's selection of which type to use for a snapshot */
  dispatcher?: ITypeDispatcher;
}

const emptyContext: InstantiateContext = {
  referenceCache: new Map(),
  referencesToResolve: [],
};

type DiscriminatorTypeMap = Record<string, IAnyType>;

/**
 * Build a map of runtime values to the type that should be constructed for snapshots with that value at the `discriminator` property
 **/
const buildDiscriminatorTypeMap = (types: IAnyType[], discriminator: string) => {
  const map: DiscriminatorTypeMap = {};

  const setMapValue = (type: IAnyType, instantiateAsType: IAnyType): any => {
    if (type instanceof UnionType) {
      // support nested unions by recursing into their types, using the same discriminator
      for (const innerUnionType of type.types) {
        setMapValue(innerUnionType, innerUnionType);
      }
    } else if (isClassModel(type) || isModelType(type)) {
      setMapValue(type.properties[discriminator], instantiateAsType);
    } else if (type instanceof OptionalType) {
      const value = type.instantiate(undefined, emptyContext);
      map[value] = instantiateAsType;
    } else if (type instanceof LiteralType) {
      map[type.value] = instantiateAsType;
    } else {
      throw new InvalidDiscriminatorError(
        `Can't use the discriminator property \`${discriminator}\` on the type \`${type}\` as it is of a type who's value can't be determined at union creation time.`
      );
    }
  };

  // figure out what the runtime value of the discriminator property is for each type
  for (const type of types) {
    setMapValue(type, type);
  }

  return map;
};

class UnionType<Types extends IAnyType[]> extends BaseType<
  Types[number]["InputType"],
  Types[number]["OutputType"],
  InstanceWithoutSTNTypeForType<Types[number]>
> {
  readonly dispatcher?: ITypeDispatcher;

  constructor(readonly types: Types, readonly options: UnionOptions = {}) {
    let dispatcher: ITypeDispatcher | undefined = undefined;

    if (options?.dispatcher) {
      dispatcher = options.dispatcher;
    } else if (options?.discriminator) {
      const discriminatorToTypeMap = buildDiscriminatorTypeMap(types, options.discriminator);

      // build a dispatcher that looks up the type based on the discriminator value from the snapshot
      dispatcher = (snapshot) => {
        const discriminatorValue = snapshot[options.discriminator!];
        let type;
        if (discriminatorValue) {
          type = discriminatorToTypeMap[discriminatorValue];
        } else {
          // if no discriminator value is present, fallback to the slow way
          type = types.find((ty) => ty.is(snapshot));
        }
        if (!type) {
          throw new TypeError(
            `Discriminator property value \`${discriminatorValue}\` for property \`${
              options.discriminator
            }\` on incoming snapshot didn't correspond to a type. Options: ${Object.keys(discriminatorToTypeMap).join(
              ", "
            )}. Snapshot was \`${JSON.stringify(snapshot)}\``
          );
        }

        return type;
      };
    }

    super(
      mstTypes.union(
        { ...options, dispatcher: dispatcher ? (snapshot) => dispatcher!(snapshot).mstType : undefined },
        ...types.map((x) => x.mstType)
      )
    );

    this.dispatcher = dispatcher;
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    let type: Types[number] | undefined;
    if (this.dispatcher) {
      type = this.dispatcher(snapshot);
    } else {
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

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return this.types.some((type) => type.is(value));
  }
}

export function union<Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types>;
export function union<Types extends [IAnyType, ...IAnyType[]]>(options: UnionOptions, ...types: Types): IUnionType<Types>;
export function union<Types extends [IAnyType, ...IAnyType[]]>(
  optionsOrType: UnionOptions | Types[number],
  ...types: Types
): IUnionType<Types> {
  let options = undefined;
  if (isType(optionsOrType)) {
    types.unshift(optionsOrType);
  } else {
    options = optionsOrType;
  }

  types.forEach(ensureRegistered);
  return new UnionType(types, options);
}

export function lazyUnion<Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types> {
  types.forEach(ensureRegistered);
  return new UnionType(types, { eager: false });
}

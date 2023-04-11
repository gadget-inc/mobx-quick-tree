import type { UnionOptions as MSTUnionOptions } from "mobx-state-tree";
import type { IAnyType, IUnionType } from "./types";
export interface UnionOptions extends MSTUnionOptions {
    /**
     * Instantiating unions can be kind of slow in general as we have to test each of the possible types against an incoming snapshot
     *
     * For quickly looking up which of the union types is the correct one for an incoming snapshot, you can set this to one of the properties that is present on all the incoming types, and union instantiation will use it to avoid the type scan.
     **/
    discriminator?: string;
}
export declare function union<Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types>;
export declare function union<Types extends [IAnyType, ...IAnyType[]]>(options: UnionOptions, ...types: Types): IUnionType<Types>;
export declare function lazyUnion<Types extends [IAnyType, ...IAnyType[]]>(...types: Types): IUnionType<Types>;

import type { IAnyType, IUnionType } from "./types";
export declare const union: <Types extends [IAnyType, ...IAnyType[]]>(...types: Types) => IUnionType<Types>;
export declare const lazyUnion: <Types extends [IAnyType, ...IAnyType[]]>(...types: Types) => IUnionType<Types>;

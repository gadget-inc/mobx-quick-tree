import type { IAnyType, IMaybeNullType, IMaybeType } from "./types";
export declare const maybe: <T extends IAnyType>(type: T) => IMaybeType<T>;
export declare const maybeNull: <T extends IAnyType>(type: T) => IMaybeNullType<T>;

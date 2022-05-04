import { $type } from "./symbols";
import type { IAnyType, IArrayType, IMSTArray, Instance } from "./types";
export declare class QuickArray<T extends IAnyType> extends Array<T["InstanceType"]> implements IMSTArray<T> {
    static get [Symbol.species](): ArrayConstructor;
    [$type]?: [this] | [any];
    [Symbol.toStringTag]: "Array";
    spliceWithArray(_index: number, _deleteCount?: number, _newItems?: Instance<T>[]): Instance<T>[];
    clear(): Instance<T>[];
    replace(_newItems: Instance<T>[]): Instance<T>[];
    remove(_value: Instance<T>): boolean;
    toJSON(): Instance<T>[];
}
export declare const array: <T extends IAnyType>(childrenType: T) => IArrayType<T>;

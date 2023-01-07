import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { $type } from "./symbols";
import type { CreateTypes, IAnyType, IMapType, IMSTMap, Instance, SnapshotOut } from "./types";
export declare class QuickMap<T extends IAnyType> extends Map<string, Instance<T>> implements IMSTMap<T> {
    static get [Symbol.species](): MapConstructor;
    [$type]?: [this] | [any];
    get [Symbol.toStringTag](): "Map";
    forEach(callbackfn: (value: Instance<T>, key: string, map: this) => void, thisArg?: any): void;
    put(_value: CreateTypes<T>): Instance<T>;
    merge(_other: any): this;
    replace(_values: any): this;
    toJSON(): Record<string, SnapshotOut<T>>;
    observe(_listener: (changes: IMapDidChange<string, Instance<T>>) => void, _fireImmediately?: boolean): Lambda;
    intercept(_handler: IInterceptor<IMapWillChange<string, Instance<T>>>): Lambda;
}
export declare const map: <T extends IAnyType>(childrenType: T) => IMapType<T>;

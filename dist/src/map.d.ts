import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { $env, $parent, $readOnly, $type } from "./symbols";
import type { CreateTypes, IAnyType, IMSTMap, IMapType, IStateTreeNode, Instance, SnapshotOut } from "./types";
export declare class QuickMap<T extends IAnyType> extends Map<string, Instance<T>> implements IMSTMap<T> {
    /** @hidden */
    readonly [$env]?: any;
    /** @hidden */
    readonly [$parent]?: IStateTreeNode | null;
    static get [Symbol.species](): MapConstructor;
    constructor(type: any, parent: IStateTreeNode | null, env: any);
    [$type]?: [this] | [any];
    get [Symbol.toStringTag](): "Map";
    get [$readOnly](): boolean;
    forEach(callbackfn: (value: Instance<T>, key: string, map: this) => void, thisArg?: any): void;
    put(_value: CreateTypes<T>): Instance<T>;
    merge(_other: any): this;
    replace(_values: any): this;
    toJSON(): Record<string, SnapshotOut<T>>;
    observe(_listener: (changes: IMapDidChange<string, Instance<T>>) => void, _fireImmediately?: boolean): Lambda;
    intercept(_handler: IInterceptor<IMapWillChange<string, Instance<T>>>): Lambda;
}
export declare const map: <T extends IAnyType>(childrenType: T) => IMapType<T>;

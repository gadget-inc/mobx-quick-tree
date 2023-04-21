import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { BaseType } from "./base";
import { $env, $parent, $readOnly, $type } from "./symbols";
import type { CreateTypes, IAnyStateTreeNode, IAnyType, IMSTMap, IMapType, IStateTreeNode, Instance, InstantiateContext, SnapshotOut } from "./types";
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
export declare class MapType<T extends IAnyType> extends BaseType<Record<string, T["InputType"]> | undefined, Record<string, T["OutputType"]>, IMSTMap<T>> {
    readonly childrenType: T;
    constructor(childrenType: T);
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"];
}
export declare const map: <T extends IAnyType>(childrenType: T) => IMapType<T>;

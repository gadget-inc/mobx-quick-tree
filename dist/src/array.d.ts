import { BaseType } from "./base";
import { $context, $parent, $readOnly, $type } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, IArrayType, IMSTArray, IStateTreeNode, Instance, TreeContext } from "./types";
export declare class QuickArray<T extends IAnyType> extends Array<Instance<T>> implements IMSTArray<T> {
    static get [Symbol.species](): ArrayConstructor;
    readonly [$context]: any;
    readonly [$parent]: IStateTreeNode | null;
    readonly [$type]: [this] | [any];
    constructor(type: any, parent: IStateTreeNode | null, context: TreeContext, ...items: Instance<T>[]);
    get [Symbol.toStringTag](): "Array";
    get [$readOnly](): boolean;
    spliceWithArray(_index: number, _deleteCount?: number, _newItems?: Instance<T>[]): Instance<T>[];
    clear(): Instance<T>[];
    replace(_newItems: Instance<T>[]): Instance<T>[];
    remove(_value: Instance<T>): boolean;
    toJSON(): Instance<T>[];
}
export declare class ArrayType<T extends IAnyType> extends BaseType<Array<T["InputType"]> | undefined, T["OutputType"][], IMSTArray<T>> {
    readonly childrenType: T;
    constructor(childrenType: T);
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare const array: <T extends IAnyType>(childrenType: T) => IArrayType<T>;

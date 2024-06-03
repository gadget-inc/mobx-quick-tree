import { BaseType } from "./base";
import type { TreeContext, ISimpleType, IStateTreeNode } from "./types";
export declare class FrozenType<T> extends BaseType<T, T, T> {
    constructor();
    instantiate(snapshot: this["InputType"] | undefined, _context: TreeContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare const frozen: <T = any>() => ISimpleType<T>;

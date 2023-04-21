import { BaseType } from "./base";
import type { IAnyType, IStateTreeNode, InstanceWithoutSTNTypeForType, InstantiateContext } from "./types";
export declare class LateType<T extends IAnyType> extends BaseType<T["InputType"], T["OutputType"], InstanceWithoutSTNTypeForType<T>> {
    private readonly fn;
    private cachedType;
    constructor(fn: () => T);
    instantiate(snapshot: this["InputType"], context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InputType"] | this["InstanceType"];
    get type(): T;
}
export declare const late: <T extends IAnyType>(fn: () => T) => T;

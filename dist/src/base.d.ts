import type { IAnyType as MSTAnyType } from "mobx-state-tree";
import { $quickType } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, InstantiateContext, StateTreeNode } from "./types";
export declare abstract class BaseType<InputType, OutputType, InstanceType> {
    readonly [$quickType]: undefined;
    readonly InputType: InputType;
    readonly OutputType: OutputType;
    readonly InstanceType: StateTreeNode<InstanceType, this>;
    readonly InstanceTypeWithoutSTN: InstanceType;
    readonly name: string;
    readonly mstType: MSTAnyType;
    constructor(mstType: MSTAnyType);
    /**
     * Create a new instance of this class model in observable mode. Uses an `mobx-state-tree` type under the hood.
     */
    create(snapshot?: this["InputType"], env?: any): this["InstanceType"];
    abstract is(value: IAnyStateTreeNode): value is this["InstanceType"];
    abstract is(value: any): value is this["InputType"] | this["InstanceType"];
    /**
     * Create a new instance of this class model in readonly mode. Properties and views are accessible on readonly instances but actions will throw if run.
     */
    createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"];
    abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}
/** @hidden */
export declare const setType: (value: unknown, type: IAnyType) => void;
/** @hidden */
export declare const setParent: (value: unknown, parent: any) => void;
/** @hidden */
export declare const setEnv: (instance: unknown, env: any) => void;

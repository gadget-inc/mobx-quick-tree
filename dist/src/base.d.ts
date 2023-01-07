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
    create(snapshot?: this["InputType"], env?: any): this["InstanceType"];
    abstract is(value: IAnyStateTreeNode): value is this["InstanceType"];
    abstract is(value: any): value is this["InputType"] | this["InstanceType"];
    createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"];
    abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}
/** @hidden */
export declare const setType: (value: unknown, type: IAnyType) => void;
/** @hidden */
export declare const setParent: (value: unknown, parent: any) => void;
/** @hidden */
export declare const setEnv: (instance: unknown, env: any) => void;

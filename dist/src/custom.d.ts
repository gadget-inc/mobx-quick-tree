import type { CustomTypeOptions } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IStateTreeNode, IType, InstantiateContext } from "./types";
export declare class CustomType<InputType, OutputType> extends BaseType<InputType, OutputType, OutputType> {
    readonly options: CustomTypeOptions<InputType, OutputType>;
    constructor(options: CustomTypeOptions<InputType, OutputType>);
    instantiate(snapshot: InputType, context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare const custom: <InputType, OutputType>(options: CustomTypeOptions<InputType, OutputType>) => IType<InputType, OutputType, OutputType>;

import { BaseType } from "./base";
import type { CreateTypes, IAnyStateTreeNode, IAnyType, InstanceWithoutSTNTypeForType, TreeContext, IOptionalType, IStateTreeNode, ValidOptionalValue } from "./types";
export type DefaultFuncOrValue<T extends IAnyType> = T["InputType"] | T["OutputType"] | (() => CreateTypes<T>);
export declare class OptionalType<T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]] = [undefined]> extends BaseType<T["InputType"] | OptionalValues[number], T["OutputType"], InstanceWithoutSTNTypeForType<T>> {
    readonly type: T;
    readonly defaultValueOrFunc: DefaultFuncOrValue<T>;
    readonly undefinedValues: OptionalValues;
    constructor(type: T, defaultValueOrFunc: DefaultFuncOrValue<T>, undefinedValues?: OptionalValues);
    instantiate(snapshot: this["InputType"], context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    schemaHash(): Promise<string>;
    private get defaultValue();
}
export type OptionalFactory = {
    <T extends IAnyType>(type: T, defaultValue: DefaultFuncOrValue<T>): IOptionalType<T, [undefined]>;
    <T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]>(type: T, defaultValue: DefaultFuncOrValue<T>, undefinedValues: OptionalValues): IOptionalType<T, OptionalValues>;
};
export declare const optional: OptionalFactory;

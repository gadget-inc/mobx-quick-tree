import { BaseType } from "./base";
import type { CreateTypes, IAnyStateTreeNode, IAnyType, InstanceWithoutSTNTypeForType, InstantiateContext, IOptionalType, ValidOptionalValue } from "./types";
export type DefaultFuncOrValue<T extends IAnyType> = T["InputType"] | T["OutputType"] | (() => CreateTypes<T>);
export declare class OptionalType<T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]> extends BaseType<T["InputType"] | OptionalValues[number], T["OutputType"], InstanceWithoutSTNTypeForType<T>> {
    readonly type: T;
    private readonly defaultValueOrFunc;
    private readonly undefinedValues?;
    constructor(type: T, defaultValueOrFunc: DefaultFuncOrValue<T>, undefinedValues?: OptionalValues | undefined);
    instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"];
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    private get defaultValue();
}
export type OptionalFactory = {
    <T extends IAnyType>(type: T, defaultValue: DefaultFuncOrValue<T>): IOptionalType<T, [undefined]>;
    <T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]>(type: T, defaultValue: DefaultFuncOrValue<T>, undefinedValues: OptionalValues): IOptionalType<T, OptionalValues>;
};
export declare const optional: OptionalFactory;

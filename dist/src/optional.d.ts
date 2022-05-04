import type { CreateTypes, IAnyType, IOptionalType, ValidOptionalValue } from "./types";
export declare type DefaultFuncOrValue<T extends IAnyType> = T["InputType"] | T["OutputType"] | (() => CreateTypes<T>);
export declare type OptionalFactory = {
    <T extends IAnyType>(type: T, defaultValue: DefaultFuncOrValue<T>): IOptionalType<T, [undefined]>;
    <T extends IAnyType, OptionalValues extends [ValidOptionalValue, ...ValidOptionalValue[]]>(type: T, defaultValue: DefaultFuncOrValue<T>, undefinedValues: OptionalValues): IOptionalType<T, OptionalValues>;
};
export declare const optional: OptionalFactory;

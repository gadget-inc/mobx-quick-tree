import type { ISimpleType } from "./types";
declare type EnumerationFactory = {
    <EnumOptions extends string>(name: string, options: EnumOptions[]): ISimpleType<EnumOptions>;
    <EnumOptions extends string>(options: EnumOptions[]): ISimpleType<EnumOptions>;
};
export declare const enumeration: EnumerationFactory;
export {};

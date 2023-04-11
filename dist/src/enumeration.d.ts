import type { ISimpleType } from "./types";
type EnumerationFactory = {
    <EnumOptions extends string>(name: string, options: readonly EnumOptions[]): ISimpleType<EnumOptions>;
    <EnumOptions extends string>(options: readonly EnumOptions[]): ISimpleType<EnumOptions>;
};
export declare const enumeration: EnumerationFactory;
export {};

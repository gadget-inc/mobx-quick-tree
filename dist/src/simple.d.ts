import type { ISimpleType as MSTSimpleType } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext, ISimpleType, IStateTreeNode } from "./types";
export type Primitives = string | number | boolean | Date | null | undefined;
export declare class SimpleType<T> extends BaseType<T, T, T> {
    readonly expectedType: string;
    static for<T extends Primitives>(expectedType: string, mstType: MSTSimpleType<T>): ISimpleType<T>;
    constructor(expectedType: string, mstType: MSTSimpleType<T>);
    instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare class DateType extends BaseType<Date | number, number, Date> {
    instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare class IntegerType extends BaseType<number, number, number> {
    constructor();
    instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare class NullType extends BaseType<null, null, null> {
    constructor();
    instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare class LiteralType<T extends Primitives> extends SimpleType<T> {
    readonly value: T;
    constructor(value: T);
    instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
}
export declare const literal: <T extends Primitives>(value: T) => ISimpleType<T>;

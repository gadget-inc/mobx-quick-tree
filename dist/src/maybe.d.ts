import { BaseType } from "./base";
import type { IAnyStateTreeNode, IAnyType, IMaybeNullType, IMaybeType, IStateTreeNode, InstanceWithoutSTNTypeForType, TreeContext } from "./types";
export declare class MaybeType<Type extends IAnyType> extends BaseType<Type["InputType"] | undefined, Type["OutputType"] | undefined, InstanceWithoutSTNTypeForType<Type> | undefined> {
    readonly type: Type;
    constructor(type: Type);
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InputType"] | this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare class MaybeNullType<Type extends IAnyType> extends BaseType<Type["InputType"] | null | undefined, Type["OutputType"] | null, InstanceWithoutSTNTypeForType<Type> | null> {
    readonly type: Type;
    constructor(type: Type);
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    schemaHash(): Promise<string>;
}
export declare const maybe: <T extends IAnyType>(type: T) => IMaybeType<T>;
export declare const maybeNull: <T extends IAnyType>(type: T) => IMaybeNullType<T>;

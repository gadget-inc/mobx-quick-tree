import type { OnReferenceInvalidated, ReferenceOptions, ReferenceOptionsGetSet } from "mobx-state-tree";
import type { ReferenceT } from "mobx-state-tree/dist/internal";
import { BaseType } from "./base";
import type { IAnyComplexType, IMaybeType, IReferenceType, IStateTreeNode, InstanceWithoutSTNTypeForType, TreeContext } from "./types";
export type SafeReferenceOptions<T extends IAnyComplexType> = (ReferenceOptionsGetSet<T["mstType"]> | Record<string, unknown>) & {
    acceptsUndefined?: boolean;
    onInvalidated?: OnReferenceInvalidated<ReferenceT<T["mstType"]>>;
};
export declare class ReferenceType<TargetType extends IAnyComplexType> extends BaseType<string, string, InstanceWithoutSTNTypeForType<TargetType>> {
    readonly targetType: IAnyComplexType;
    constructor(targetType: IAnyComplexType, options?: ReferenceOptions<TargetType["mstType"]>);
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash: () => Promise<string>;
}
export declare class SafeReferenceType<TargetType extends IAnyComplexType> extends BaseType<string | undefined, string | undefined, InstanceWithoutSTNTypeForType<TargetType> | undefined> {
    readonly targetType: IAnyComplexType;
    constructor(targetType: IAnyComplexType, options?: SafeReferenceOptions<TargetType>);
    instantiate(snapshot: string | undefined, context: TreeContext, _parent: IStateTreeNode | null): this["InstanceType"];
    is(value: any): value is this["InstanceType"];
    schemaHash: () => Promise<string>;
}
export declare const reference: <TargetType extends IAnyComplexType>(targetType: TargetType, options?: ReferenceOptions<TargetType["mstType"]>) => IReferenceType<TargetType>;
export declare const safeReference: <TargetType extends IAnyComplexType>(targetType: TargetType, options?: SafeReferenceOptions<TargetType>) => IMaybeType<IReferenceType<TargetType>>;

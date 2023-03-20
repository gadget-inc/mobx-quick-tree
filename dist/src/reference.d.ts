import type { OnReferenceInvalidated, ReferenceOptions, ReferenceOptionsGetSet } from "mobx-state-tree";
import type { ReferenceT } from "mobx-state-tree/dist/internal";
import type { IAnyComplexType, IMaybeType, IReferenceType } from "./types";
export type SafeReferenceOptions<T extends IAnyComplexType> = (ReferenceOptionsGetSet<T["mstType"]> | Record<string, unknown>) & {
    acceptsUndefined?: boolean;
    onInvalidated?: OnReferenceInvalidated<ReferenceT<T["mstType"]>>;
};
export declare const reference: <TargetType extends IAnyComplexType>(targetType: TargetType, options?: ReferenceOptions<TargetType["mstType"]> | undefined) => IReferenceType<TargetType>;
export declare const safeReference: <TargetType extends IAnyComplexType>(targetType: TargetType, options?: SafeReferenceOptions<TargetType> | undefined) => IMaybeType<IReferenceType<TargetType>>;

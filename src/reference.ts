import { OnReferenceInvalidated, ReferenceOptions, ReferenceOptionsGetSet, types } from "mobx-state-tree";
import { ReferenceT } from "mobx-state-tree/dist/internal";
import { BaseType } from "./base";
import type { IAnyComplexType, IMaybeType, InstantiateContext, IReferenceType } from "./types";

export type SafeReferenceOptions<T extends IAnyComplexType> = (ReferenceOptionsGetSet<T["mstType"]> | Record<string, unknown>) & {
  acceptsUndefined?: boolean;
  onInvalidated?: OnReferenceInvalidated<ReferenceT<T["mstType"]>>;
};

export class ReferenceType<TargetType extends IAnyComplexType> extends BaseType<string, string, TargetType["InstanceTypeWithoutSTN"]> {
  constructor(readonly targetType: IAnyComplexType, options?: ReferenceOptions<TargetType["mstType"]>) {
    super(types.reference(targetType.mstType, options));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot || !context.referenceCache.has(snapshot)) {
      throw new Error(`can't resolve reference ${snapshot}`);
    }
    return context.referenceCache.get(snapshot);
  }
}

export class SafeReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string | undefined,
  string | undefined,
  TargetType["InstanceTypeWithoutSTN"] | undefined
> {
  constructor(readonly targetType: IAnyComplexType, options?: SafeReferenceOptions<TargetType>) {
    super(types.safeReference(targetType.mstType, options));
  }

  instantiate(snapshot: string | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot || !context.referenceCache.has(snapshot)) {
      return undefined as this["InstanceType"];
    }
    return context.referenceCache.get(snapshot);
  }
}

export const reference = <TargetType extends IAnyComplexType>(
  targetType: TargetType,
  options?: ReferenceOptions<TargetType["mstType"]>
): IReferenceType<TargetType> => {
  return new ReferenceType(targetType, options);
};

export const safeReference = <TargetType extends IAnyComplexType>(
  targetType: TargetType,
  options?: SafeReferenceOptions<TargetType>
): IMaybeType<IReferenceType<TargetType>> => {
  return new SafeReferenceType(targetType, options);
};

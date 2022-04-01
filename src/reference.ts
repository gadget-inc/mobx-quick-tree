import {
  IMaybe,
  IReferenceType as MSTReferenceType,
  OnReferenceInvalidated,
  ReferenceOptions,
  ReferenceOptionsGetSet,
  types,
} from "mobx-state-tree";
import { ReferenceT } from "mobx-state-tree/dist/internal";
import { BaseType } from "./base";
import type { IAnyComplexType, IMaybeType, InstantiateContext, IReferenceType } from "./types";

export type SafeReferenceOptions<T extends IAnyComplexType> = (ReferenceOptionsGetSet<T["mstType"]> | {}) & {
  acceptsUndefined?: boolean;
  onInvalidated?: OnReferenceInvalidated<ReferenceT<T["mstType"]>>;
};

// FIXME although we say the output types are strings, technically they'll actually be the instance type right now

export class ReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string,
  string,
  TargetType["InstanceType"],
  MSTReferenceType<TargetType["mstType"]>
> {
  constructor(readonly targetType: IAnyComplexType, options?: ReferenceOptions<TargetType["mstType"]>) {
    super(`reference<${targetType.name}>`, types.reference(targetType.mstType, options));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot || !(snapshot in context.referenceCache)) {
      throw new Error(`can't resolve reference ${snapshot}`);
    }
    return context.referenceCache[snapshot] as this["InstanceType"];
  }
}

export class SafeReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string | undefined,
  string | undefined,
  TargetType["InstanceType"] | undefined,
  IMaybe<MSTReferenceType<TargetType["mstType"]>>
> {
  constructor(readonly targetType: IAnyComplexType, options?: SafeReferenceOptions<TargetType>) {
    super(`safeReference<${targetType.name}>`, types.safeReference(targetType.mstType, options));
  }

  instantiate(snapshot: string | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot) {
      return undefined as this["InstanceType"];
    }
    return context.referenceCache[snapshot] as this["InstanceType"];
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

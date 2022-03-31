import { IMaybe, IReferenceType, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyComplexType, InstantiateContext } from "./types";

export class ReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string,
  TargetType["InstanceType"],
  IReferenceType<TargetType["mstType"]>
> {
  constructor(readonly targetType: IAnyComplexType) {
    super(`reference<${targetType.name}>`, types.reference(targetType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot || !(snapshot in context.referenceCache)) {
      throw new Error(`can't resolve reference ${snapshot}`);
    }
    return context.referenceCache[snapshot] as this["InstanceType"];
  }
}

export class SafeReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string,
  TargetType["InstanceType"],
  IMaybe<IReferenceType<TargetType["mstType"]>>
> {
  constructor(readonly targetType: IAnyComplexType) {
    super(`safeReference<${targetType.name}>`, types.safeReference(targetType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (!snapshot) {
      return undefined as this["InstanceType"];
    }
    return context.referenceCache[snapshot] as this["InstanceType"];
  }
}

export const reference = <TargetType extends IAnyComplexType>(targetType: TargetType): ReferenceType<TargetType> => {
  return new ReferenceType(targetType);
};

export const safeReference = <TargetType extends IAnyComplexType>(
  targetType: TargetType
): SafeReferenceType<TargetType> => {
  return new SafeReferenceType(targetType);
};

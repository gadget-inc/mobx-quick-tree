import type { OnReferenceInvalidated, ReferenceOptions, ReferenceOptionsGetSet } from "mobx-state-tree";
import { types } from "mobx-state-tree";
import type { ReferenceT } from "mobx-state-tree/dist/internal";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import type {
  IAnyComplexType,
  IAnyType,
  IMaybeType,
  IReferenceType,
  IStateTreeNode,
  InstanceWithoutSTNTypeForType,
  TreeContext,
} from "./types";
import memoize from "lodash.memoize";

export type SafeReferenceOptions<T extends IAnyComplexType> = (ReferenceOptionsGetSet<T["mstType"]> | Record<string, unknown>) & {
  acceptsUndefined?: boolean;
  onInvalidated?: OnReferenceInvalidated<ReferenceT<T["mstType"]>>;
};

const referenceSchemaHash = async (type: string, targetType: IAnyType) => {
  return `${type}:${await targetType.schemaHash()}`;
};

export class ReferenceType<TargetType extends IAnyComplexType> extends BaseType<string, string, InstanceWithoutSTNTypeForType<TargetType>> {
  constructor(
    readonly targetType: IAnyComplexType,
    options?: ReferenceOptions<TargetType["mstType"]>,
  ) {
    super(types.reference(targetType.mstType, options));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, _parent: IStateTreeNode | null): this["InstanceType"] {
    if (!snapshot || !context.referenceCache.has(snapshot)) {
      throw new Error(`can't resolve reference ${snapshot}`);
    }
    return context.referenceCache.get(snapshot);
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return typeof value == "string";
  }

  schemaHash: () => Promise<string> = memoize(async () => {
    return await referenceSchemaHash("reference", this.targetType);
  });
}

export class SafeReferenceType<TargetType extends IAnyComplexType> extends BaseType<
  string | undefined,
  string | undefined,
  InstanceWithoutSTNTypeForType<TargetType> | undefined
> {
  constructor(
    readonly targetType: IAnyComplexType,
    readonly options?: SafeReferenceOptions<TargetType>,
  ) {
    super(types.safeReference(targetType.mstType, options));
  }

  instantiate(snapshot: string | undefined, context: TreeContext, _parent: IStateTreeNode | null): this["InstanceType"] {
    if (!snapshot || !context.referenceCache.has(snapshot)) {
      return undefined as this["InstanceType"];
    }
    return context.referenceCache.get(snapshot);
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return typeof value == "string";
  }

  schemaHash: () => Promise<string> = memoize(async () => {
    return await referenceSchemaHash("safe-reference", this.targetType);
  });
}

export const reference = <TargetType extends IAnyComplexType>(
  targetType: TargetType,
  options?: ReferenceOptions<TargetType["mstType"]>,
): IReferenceType<TargetType> => {
  ensureRegistered(targetType);
  return new ReferenceType(targetType, options);
};

export function safeReference<IT extends IAnyComplexType>(
  subType: IT,
  options: SafeReferenceOptions<IT> & { acceptsUndefined: false },
): IReferenceType<IT>;
export function safeReference<IT extends IAnyComplexType>(subType: IT, options?: SafeReferenceOptions<IT>): IMaybeType<IReferenceType<IT>>;
export function safeReference<TargetType extends IAnyComplexType>(
  targetType: TargetType,
  options?: SafeReferenceOptions<TargetType>,
): IMaybeType<IReferenceType<TargetType>> {
  ensureRegistered(targetType);
  return new SafeReferenceType(targetType, options);
}

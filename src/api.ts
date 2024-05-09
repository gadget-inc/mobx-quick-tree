import type {
  IDisposer,
  IAnyComplexType as MSTAnyComplexType,
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  IStateTreeNode as MSTStateTreeNode,
} from "mobx-state-tree";
import {
  applySnapshot as mstApplySnapshot,
  flow as mstFlow,
  getEnv as mstGetEnv,
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getType as mstGetType,
  hasEnv as mstHasEnv,
  isArrayType as mstIsArrayType,
  isIdentifierType as mstIsIdentifierType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isReferenceType as mstIsReferenceType,
  isRoot as mstIsRoot,
  isStateTreeNode as mstIsStateTreeNode,
  isType as mstIsType,
  onSnapshot as mstOnSnapshot,
  resolveIdentifier as mstResolveIdentifier,
} from "mobx-state-tree";
import type { FlowReturn } from "mobx-state-tree/dist/internal";
import { CantRunActionError } from "./errors";
import { $context, $parent, $quickType, $readOnly, $type } from "./symbols";
import type {
  CreateTypes,
  IAnyComplexType,
  IAnyModelType,
  IAnyStateTreeNode,
  IAnyType,
  IArrayType,
  IClassModelType,
  IMapType,
  IReferenceType,
  IStateTreeNode,
  IType,
  Instance,
  SnapshotIn,
  TreeContext,
} from "./types";

export {
  addDisposer,
  addMiddleware,
  applyPatch,
  clone,
  createActionTrackingMiddleware2,
  destroy,
  detach,
  escapeJsonPath,
  getIdentifier,
  getPath,
  getPathParts,
  getRunningActionContext,
  hasParent,
  isActionContextThisOrChildOf,
  isAlive,
  isValidReference,
  joinJsonPath,
  onAction,
  onPatch,
  recordPatches,
  resolvePath,
  setLivelinessChecking,
  splitJsonPath,
  tryReference,
  typecheck,
  unescapeJsonPath,
  walk,
} from "mobx-state-tree";

export { ClassModel, action, extend, register, view, volatile, volatileAction } from "./class-model";
export { getSnapshot } from "./snapshot";

export const isType = (value: any): value is IAnyType => {
  return $quickType in value;
};

/**
 * Returns true if the given object is a complex type in observable mode
 * @param value any object
 * @returns
 */
export const isStateTreeNode = (value: any): value is IStateTreeNode => {
  if (mstIsStateTreeNode(value)) {
    return true;
  }

  return typeof value === "object" && value !== null && $type in value;
};

/**
 * Returns true if the given object is a complex type in readonly mode
 * @param value any object
 * @returns
 */
export const isReadOnlyNode = (value: any): value is IStateTreeNode => {
  return typeof value === "object" && value !== null && $readOnly in value;
};

export const getParent = <T extends IAnyType>(value: IAnyStateTreeNode, depth = 1): Instance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetParent(value, depth) as Instance<T>;
  }

  while (value && depth > 0) {
    value = value[$parent];
    depth -= 1;
  }

  if (!value) {
    throw new Error("failed to get parent");
  }

  return value;
};

export function getParentOfType<T extends IAnyComplexType | MSTAnyComplexType>(value: IAnyStateTreeNode, type: T): Instance<T> {
  if (mstIsStateTreeNode(value)) {
    if (mstIsType(type)) {
      return mstGetParentOfType(value, type);
    } else {
      return mstGetParentOfType(value, type.mstType) as Instance<T>;
    }
  }

  value = value[$parent];
  while (value) {
    if (type.is(value)) {
      break;
    }

    value = value[$parent];
  }

  if (!value) {
    throw new Error("failed to get parent");
  }

  return value;
}

export function getType(value: IAnyStateTreeNode): MSTAnyComplexType | IAnyComplexType {
  if (mstIsStateTreeNode(value)) {
    return mstGetType(value);
  }

  return value[$type];
}

/** @hidden */
export function getContext(value: IAnyStateTreeNode): TreeContext | null {
  if (mstIsStateTreeNode(value)) {
    throw new Error("can't get the context of an observable node, this function is only for use on readonly nodes");
  }

  // Assumes no cycles, otherwise this is an infinite loop
  let currentNode: IStateTreeNode = value;
  while (currentNode) {
    const context = (currentNode as any)[$context];
    if (context !== undefined) {
      return context;
    }

    currentNode = (currentNode as any)[$parent];
  }

  return null;
}

export function getEnv<Env = any>(value: IAnyStateTreeNode): Env {
  if (mstIsStateTreeNode(value)) {
    return mstGetEnv(value);
  }

  const env = getContext(value)?.env;
  if (!env) {
    throw new Error(`Failed to find the environment of ${value}`);
  }

  return env as Env;
}

export function hasEnv(value: IAnyStateTreeNode): boolean {
  if (mstIsStateTreeNode(value)) {
    return mstHasEnv(value);
  }

  return !!getContext(value)?.env;
}

export const getRoot = <T extends IAnyType>(value: IAnyStateTreeNode): Instance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetRoot(value) as Instance<T>;
  }

  // Assumes no cycles, otherwise this is an infinite loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const newValue = value[$parent];
    if (newValue) {
      value = newValue;
    } else {
      return value;
    }
  }
};

export const isRoot = (value: IAnyStateTreeNode): boolean => {
  if (mstIsStateTreeNode(value)) {
    return mstIsRoot(value);
  }

  return !value[$parent];
};

export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: IStateTreeNode<IAnyType>,
  identifier: string,
): Instance<T> | undefined {
  if (mstIsStateTreeNode(target)) {
    if (isType(type)) {
      return mstResolveIdentifier(type.mstType as MSTAnyModelType, target, identifier);
    } else {
      return mstResolveIdentifier(type, target, identifier);
    }
  }

  const context = getContext(target);
  if (!context) {
    throw new Error("can't resolve references in a readonly tree with no context");
  }
  return context.referenceCache.get(identifier) as Instance<T> | undefined;
}

export const applySnapshot = <T extends IAnyType>(target: IStateTreeNode<T>, snapshot: SnapshotIn<T>): void => {
  if (mstIsStateTreeNode(target)) {
    mstApplySnapshot(target as MSTStateTreeNode, snapshot);
    return;
  }

  throw new Error("can't apply a snapshot to a mobx-quick-tree node");
};

export const onSnapshot = <S>(
  target: IStateTreeNode<IType<any, S, any>> | IStateTreeNode<IClassModelType<any, any, S>>,
  callback: (snapshot: S) => void,
): IDisposer => {
  if (mstIsStateTreeNode(target)) {
    return mstOnSnapshot<S>(target as MSTStateTreeNode, callback);
  }

  throw new Error("can't use onSnapshot with a mobx-quick-tree node");
};

export const isArrayType = (value: IAnyType | MSTAnyType): value is IArrayType<IAnyType> => {
  if (mstIsType(value)) {
    return mstIsArrayType(value);
  }
  return mstIsArrayType(value.mstType);
};

export const isMapType = (value: IAnyType | MSTAnyType): value is IMapType<IAnyType> => {
  if (mstIsType(value)) {
    return mstIsMapType(value);
  }
  return mstIsMapType(value.mstType);
};

export const isModelType = (value: IAnyType | MSTAnyType): value is IAnyModelType => {
  if (mstIsType(value)) {
    return mstIsModelType(value);
  }
  return mstIsModelType(value.mstType);
};

export const isReferenceType = (value: IAnyType | MSTAnyType): value is IReferenceType<IAnyComplexType> => {
  if (mstIsType(value)) {
    return mstIsReferenceType(value);
  }
  return mstIsReferenceType(value.mstType);
};

export const isIdentifierType = (value: IAnyType | MSTAnyType): value is IReferenceType<IAnyComplexType> => {
  if (mstIsType(value)) {
    return mstIsIdentifierType(value);
  }
  return mstIsIdentifierType(value.mstType);
};

export function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export function cast(snapshotOrInstance: never): never;
export function cast(snapshotOrInstance: any): any {
  return snapshotOrInstance;
}

/**
 * Defines a new asynchronous action. `mobx-quick-tree` (and `mobx-state-tree`) require this wrapper around asynchronous actions, and require those action functions to be generators using `yield` instead of `await`.
 *
 * Accepts an incoming generator function and returns a new async function with the right mobx-state-tree wrapping.
 * See https://mobx-state-tree.js.org/concepts/async-actions for more info.
 */
export function flow<R, Args extends any[], This = unknown>(
  generator: (this: This, ...args: Args) => Generator<PromiseLike<any>, R, any>,
): (...args: Args) => Promise<FlowReturn<R>> {
  // wrap the passed generator in a function which restores the correct value of `this`
  const wrappedGenerator = mstFlow(function* (args: Args, instance: This) {
    return yield* generator.call(instance, ...args);
  });

  // return an async function to set on the prototype which ensures the instance is not readonly
  return async function (this: This, ...args: Args): Promise<FlowReturn<R>> {
    if ((this?.constructor as any)?.isMQTClassModel) {
      throw new CantRunActionError(`Can't run flow action for a readonly instance`);
    }
    return await wrappedGenerator(args, this);
  };
}

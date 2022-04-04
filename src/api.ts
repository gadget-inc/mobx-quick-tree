import {
  getEnv as mstGetEnv,
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getSnapshot as mstGetSnapshot,
  getType as mstGetType,
  IAnyComplexType as MSTAnyComplexType,
  IAnyType as MSTAnyType,
  Instance as MSTInstance,
  isArrayType as mstIsArrayType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isRoot as mstIsRoot,
  isStateTreeNode,
  IStateTreeNode as MSTStateTreeNode,
  IType as MSTType,
  resolveIdentifier as mstResolveIdentifier,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { $env, $parent, $quickType, $type } from "./symbols";
import type {
  CreateTypes,
  IAnyComplexType,
  IAnyModelType,
  IAnyType,
  IArrayType,
  IMapType,
  Instance,
  IQuickTreeNode,
  IStateTreeNode,
  IType,
  QuickOrMSTInstance,
} from "./types";

export {
  addDisposer,
  addMiddleware,
  applyPatch,
  applySnapshot,
  clone,
  createActionTrackingMiddleware2,
  destroy,
  detach,
  escapeJsonPath,
  flow,
  getIdentifier,
  getPath,
  getPathParts,
  hasParent,
  isActionContextThisOrChildOf,
  isAlive,
  isStateTreeNode,
  IStateTreeNode as MSTStateTreeNode,
  isValidReference,
  joinJsonPath,
  onAction,
  onPatch,
  onSnapshot,
  recordPatches,
  resolvePath,
  setLivelinessChecking,
  splitJsonPath,
  tryReference,
  typecheck,
  walk,
} from "mobx-state-tree";

export const isType = (value: any): value is IAnyType => {
  return $quickType in value;
};

export const getParent = <T extends IAnyType>(value: any, depth = 1): QuickOrMSTInstance<T> => {
  if (isStateTreeNode(value)) {
    return mstGetParent(value, depth);
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

export function getParentOfType<T extends IAnyComplexType>(value: any, type: T): Instance<T>;
export function getParentOfType<T extends MSTAnyComplexType>(value: any, type: T): MSTInstance<T>;
export function getParentOfType<T extends IAnyComplexType>(value: any, type: T): QuickOrMSTInstance<T> {
  if (isStateTreeNode(value)) {
    return mstGetParentOfType(value, type.mstType);
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

export function getType(value: MSTInstance<MSTAnyType>): MSTAnyComplexType;
export function getType(value: IQuickTreeNode<IAnyType>): IAnyComplexType;
export function getType(value: IStateTreeNode<IAnyType>): MSTAnyComplexType | IAnyComplexType {
  if (isStateTreeNode(value)) {
    return mstGetType(value);
  }

  return value[$type];
}

export function getEnv<Env = any>(value: IStateTreeNode<IAnyType>): Env {
  if (isStateTreeNode(value)) {
    return mstGetEnv(value);
  }

  // Assumes no cycles, otherwise this is an infinite loop
  let currentNode: IQuickTreeNode<IAnyType> = value;
  while (currentNode) {
    const env = currentNode[$env];
    if (env !== undefined) {
      return env;
    }

    currentNode = currentNode[$parent];
  }

  return {} as Env;
}

export function getSnapshot<S, M extends MSTAnyType>(value: IStateTreeNode<IType<any, S, any, M>>): S;
export function getSnapshot<S>(value: MSTInstance<MSTType<any, S, any>>): S;
export function getSnapshot<S, M extends MSTAnyType>(value: IStateTreeNode<IType<any, S, any, M>>): S {
  if (isStateTreeNode(value)) {
    return mstGetSnapshot<MSTSnapshotOut<M>>(value);
  }

  // TODO this isn't quite right, primarily for reference types. The snapshot = string, but the instance = object.
  return value as unknown as S;
}

export const getRoot = <T extends IAnyType>(value: any): QuickOrMSTInstance<T> => {
  if (isStateTreeNode(value)) {
    return mstGetRoot(value);
  }

  // Assumes no cycles, otherwise this is an infinite loop
  while (true) {
    const newValue = value[$parent];
    if (newValue) {
      value = newValue;
    } else {
      return value;
    }
  }
};

export const isRoot = (value: any): boolean => {
  if (isStateTreeNode(value)) {
    return mstIsRoot(value);
  }

  return value[$parent] === undefined;
};

export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: IQuickTreeNode<IAnyType>,
  identifier: string
): Instance<T> | undefined;
export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: MSTStateTreeNode<MSTAnyType>,
  identifier: string
): MSTInstance<T> | undefined;
export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: IStateTreeNode<IAnyType>,
  identifier: string
): QuickOrMSTInstance<T> | undefined {
  if (isStateTreeNode(target)) {
    return mstResolveIdentifier(type.mstType, target, identifier);
  }

  throw new Error("not yet implemented");
}

export const isArrayType = (value: IAnyType): value is IArrayType<IAnyType> => {
  return mstIsArrayType(value.mstType);
};

export const isMapType = (value: IAnyType): value is IMapType<IAnyType> => {
  return mstIsMapType(value.mstType);
};

export const isModelType = (value: IAnyType): value is IAnyModelType => {
  return mstIsModelType(value.mstType);
};

export function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export function cast(snapshotOrInstance: never): never;
export function cast(snapshotOrInstance: any): any {
  return snapshotOrInstance;
}

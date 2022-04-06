import {
  getEnv as mstGetEnv,
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getSnapshot as mstGetSnapshot,
  getType as mstGetType,
  IAnyComplexType as MSTAnyComplexType,
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  Instance as MSTInstance,
  isArrayType as mstIsArrayType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isRoot as mstIsRoot,
  isStateTreeNode as mstIsStateTreeNode,
  IStateTreeNode as MSTStateTreeNode,
  isType as mstIsType,
  IType as MSTType,
  resolveIdentifier as mstResolveIdentifier,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { $env, $parent, $quickType, $type } from "./symbols";
import type {
  CreateTypes,
  IAnyComplexType,
  IAnyModelType,
  IAnyStateTreeNode,
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

export const isStateTreeNode = (value: any): value is IAnyStateTreeNode => {
  if (mstIsStateTreeNode(value)) {
    return true;
  }

  return typeof value === "object" && value !== null && $type in value;
};

export const getParent = <T extends IAnyType>(value: IAnyStateTreeNode, depth = 1): QuickOrMSTInstance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetParent(value, depth) as QuickOrMSTInstance<T>;
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

export function getParentOfType<T extends IAnyComplexType | MSTAnyComplexType>(
  value: IAnyStateTreeNode,
  type: T
): QuickOrMSTInstance<T> {
  if (mstIsStateTreeNode(value)) {
    if (mstIsType(type)) {
      return mstGetParentOfType(value, type);
    } else {
      return mstGetParentOfType(value, type.mstType) as QuickOrMSTInstance<T>;
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

export function getType(value: MSTInstance<MSTAnyType>): MSTAnyComplexType;
export function getType(value: IQuickTreeNode<IAnyType>): IAnyComplexType;
export function getType(value: IStateTreeNode<IAnyType>): MSTAnyComplexType | IAnyComplexType {
  if (mstIsStateTreeNode(value)) {
    return mstGetType(value);
  }

  return value[$type];
}

export function getEnv<Env = any>(value: IStateTreeNode<IAnyType>): Env {
  if (mstIsStateTreeNode(value)) {
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

export function getSnapshot<S>(value: IQuickTreeNode<IType<any, S, any, any>>): S;
export function getSnapshot<S>(value: MSTInstance<MSTType<any, S, any>>): S;
export function getSnapshot<S, M extends MSTAnyType>(value: IStateTreeNode<IType<any, S, any, M>>): S {
  if (mstIsStateTreeNode(value)) {
    return mstGetSnapshot<MSTSnapshotOut<M>>(value);
  }

  // TODO this isn't quite right, primarily for reference types. The snapshot = string, but the instance = object.
  return value as unknown as S;
}

export const getRoot = <T extends IAnyType>(value: IAnyStateTreeNode): QuickOrMSTInstance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetRoot(value) as T["mstType"]["Type"]; // Not sure why MSTInstance doesn't work here
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
  if (mstIsStateTreeNode(value)) {
    return mstIsRoot(value);
  }

  return value[$parent] === undefined;
};

export function resolveIdentifier<T extends IAnyModelType | MSTAnyModelType>(
  type: T,
  target: IQuickTreeNode<IAnyType>,
  identifier: string
): Instance<T> | undefined;
export function resolveIdentifier<T extends IAnyModelType | MSTAnyModelType>(
  type: T,
  target: MSTStateTreeNode<MSTAnyType>,
  identifier: string
): MSTInstance<T> | undefined;
export function resolveIdentifier<T extends IAnyModelType | MSTAnyModelType>(
  type: T,
  target: IStateTreeNode<IAnyType>,
  identifier: string
): QuickOrMSTInstance<T> | undefined {
  if (mstIsStateTreeNode(target)) {
    if (mstIsType(type)) {
      return mstResolveIdentifier(type, target, identifier);
    } else {
      return mstResolveIdentifier(type.mstType, target, identifier);
    }
  }

  throw new Error("not yet implemented");
}

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

export function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export function cast(snapshotOrInstance: never): never;
export function cast(snapshotOrInstance: any): any {
  return snapshotOrInstance;
}

import {
  applySnapshot as mstApplySnapshot,
  getEnv as mstGetEnv,
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getType as mstGetType,
  IAnyComplexType as MSTAnyComplexType,
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  IDisposer,
  isArrayType as mstIsArrayType,
  isIdentifierType as mstIsIdentifierType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isReferenceType as mstIsReferenceType,
  isRoot as mstIsRoot,
  isStateTreeNode as mstIsStateTreeNode,
  IStateTreeNode as MSTStateTreeNode,
  isType as mstIsType,
  onSnapshot as mstOnSnapshot,
  resolveIdentifier as mstResolveIdentifier,
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
  IReferenceType,
  IStateTreeNode,
  IType,
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
  recordPatches,
  resolvePath,
  setLivelinessChecking,
  splitJsonPath,
  tryReference,
  typecheck,
  walk,
} from "mobx-state-tree";
export { getSnapshot } from "./snapshot";

export const isType = (value: any): value is IAnyType => {
  return $quickType in value;
};

export const isStateTreeNode = (value: any): value is IStateTreeNode => {
  if (mstIsStateTreeNode(value)) {
    return true;
  }

  return typeof value === "object" && value !== null && $type in value;
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

export function getEnv<Env = any>(value: IAnyStateTreeNode): Env {
  if (mstIsStateTreeNode(value)) {
    return mstGetEnv(value);
  }

  // Assumes no cycles, otherwise this is an infinite loop
  let currentNode: IStateTreeNode = value;
  while (currentNode) {
    const env = (currentNode as any)[$env];
    if (env !== undefined) {
      return env;
    }

    currentNode = (currentNode as any)[$parent];
  }

  return {} as Env;
}

export const getRoot = <T extends IAnyType>(value: IAnyStateTreeNode): Instance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetRoot(value) as Instance<T>;
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

export const isRoot = (value: IAnyStateTreeNode): boolean => {
  if (mstIsStateTreeNode(value)) {
    return mstIsRoot(value);
  }

  return value[$parent] === undefined;
};

export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: IStateTreeNode<IAnyType>,
  identifier: string
): Instance<T> | undefined {
  if (mstIsStateTreeNode(target)) {
    if (isType(type)) {
      return mstResolveIdentifier(type.mstType as MSTAnyModelType, target, identifier);
    } else {
      return mstResolveIdentifier(type, target, identifier);
    }
  }

  throw new Error("not yet implemented");
}

export const applySnapshot = <C>(target: IStateTreeNode<IType<C, any, any>>, snapshot: C): void => {
  if (mstIsStateTreeNode(target)) {
    mstApplySnapshot<C>(target as MSTStateTreeNode, snapshot);
    return;
  }

  throw new Error("can't apply a snapshot to a mobx-quick-tree node");
};

export const onSnapshot = <S>(target: IStateTreeNode<IType<any, S, any>>, callback: (snapshot: S) => void): IDisposer => {
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

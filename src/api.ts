import {
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getSnapshot as mstGetSnapshot,
  getType as mstGetType,
  IAnyComplexType as MSTAnyComplexType,
  IAnyType as MSTAnyType,
  isArrayType as mstIsArrayType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isRoot as mstIsRoot,
  isStateTreeNode,
  IStateTreeNode as MSTStateTreeNode,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { $parent, $quickType, $type } from "./symbols";
import type { IAnyComplexType, IAnyType, IQuickTreeNode, IStateTreeNode, IType, QuickOrMSTInstance } from "./types";

export {
  addDisposer,
  addMiddleware,
  applyPatch,
  applySnapshot,
  cast,
  clone,
  createActionTrackingMiddleware2,
  destroy,
  detach,
  escapeJsonPath,
  flow,
  getEnv,
  getIdentifier,
  getPath,
  getPathParts,
  hasParent,
  isActionContextThisOrChildOf,
  isAlive,
  isStateTreeNode,
  isValidReference,
  joinJsonPath,
  onAction,
  onPatch,
  onSnapshot,
  recordPatches,
  resolveIdentifier,
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

export const getParentOfType = <T extends IAnyComplexType>(value: any, type: T): QuickOrMSTInstance<T> => {
  if (isStateTreeNode(value)) {
    return mstGetParentOfType(value, type.mstType);
  }

  while (value) {
    value = value[$parent];
    if (value[$type] === type) {
      break;
    }
  }

  if (!value) {
    throw new Error("failed to get parent");
  }

  return value;
};

export function getType(value: MSTStateTreeNode<MSTAnyType>): MSTAnyComplexType;
export function getType(value: IQuickTreeNode<IAnyType>): IAnyComplexType;
export function getType(value: IStateTreeNode<IAnyType>): MSTAnyComplexType | IAnyComplexType {
  if (isStateTreeNode(value)) {
    return mstGetType(value);
  }

  return value[$type];
}

export const getSnapshot = <S, M extends MSTAnyType>(value: IStateTreeNode<IType<any, S, any, M>>): S => {
  if (isStateTreeNode(value)) {
    return mstGetSnapshot<MSTSnapshotOut<M>>(value);
  }

  // TODO this isn't quite right, primarily for reference types. The snapshot = string, but the instance = object.
  return value as unknown as S;
};

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

export const isArrayType = (value: IAnyType) => {
  return mstIsArrayType(value.mstType);
};

export const isMapType = (value: IAnyType) => {
  return mstIsMapType(value.mstType);
};

export const isModelType = (value: IAnyType) => {
  return mstIsModelType(value.mstType);
};

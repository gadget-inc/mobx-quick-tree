import {
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  isArrayType as mstIsArrayType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isRoot as mstIsRoot,
  isStateTreeNode,
} from "mobx-state-tree";
import { $parent, $type } from "./symbols";
import type { IAnyComplexType, IAnyType } from "./types";

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
  getSnapshot,
  getType,
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

export const getParent = (value: any, depth = 1): Record<string, unknown> | undefined => {
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

export const getParentOfType = <T extends IAnyComplexType>(value: any, type: T): T["InstanceType"] | undefined => {
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

export const getRoot = (value: any): Record<string, unknown> | undefined => {
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

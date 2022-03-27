import { getParent as mstGetParent, getRoot as mstGetRoot, isStateTreeNode } from "mobx-state-tree";
import { $parent } from "./symbols";

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

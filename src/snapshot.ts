import { getSnapshot as mstGetSnapshot, IAnyType as MSTAnyType, isStateTreeNode as mstIsStateTreeNode } from "mobx-state-tree";
import { getType, isModelType, isReferenceType, isStateTreeNode } from "./api";
import { QuickArray } from "./array";
import { QuickMap } from "./map";
import { $identifier } from "./symbols";
import { IQuickTreeNode, IStateTreeNode, IType } from "./types";

export function getSnapshot<S, M extends MSTAnyType>(value: IStateTreeNode<IType<any, S, any, M>>): S {
  if (mstIsStateTreeNode(value)) {
    return mstGetSnapshot(value);
  }

  return snapshot(value) as S;
}

const snapshot = (value: any): unknown => {
  if (value instanceof QuickArray) {
    return value.map((v) => snapshot(v));
  }

  if (value instanceof QuickMap) {
    return Object.fromEntries(Array.from(value.entries()).map(([k, v]) => [k, snapshot(v)]));
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (isStateTreeNode(value)) {
    const type = getType(value as IQuickTreeNode);
    if (isModelType(type)) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, snapshot(v)]));
    } else if (isReferenceType(type)) {
      return (value as any)[$identifier];
    }
  }

  return value;
};

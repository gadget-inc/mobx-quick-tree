import { getSnapshot as mstGetSnapshot, isStateTreeNode as mstIsStateTreeNode, IStateTreeNode as MSTStateTreeNode } from "mobx-state-tree";
import { getType, isModelType, isReferenceType, isStateTreeNode } from "./api";
import { QuickArray } from "./array";
import { QuickMap } from "./map";
import { $identifier } from "./symbols";
import { IStateTreeNode, IType } from "./types";

export function getSnapshot<S>(value: IStateTreeNode<IType<any, S, any>>): S {
  if (mstIsStateTreeNode(value)) {
    return mstGetSnapshot<S>(value as MSTStateTreeNode);
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
    const type = getType(value);
    if (isModelType(type)) {
      const modelSnapshot: Record<string, any> = {};
      for (const name in type.properties) {
        const propType = type.properties[name];
        if (isReferenceType(propType)) {
          modelSnapshot[name] = (value as any)[name][$identifier];
        } else {
          modelSnapshot[name] = snapshot((value as any)[name]);
        }
      }
      return modelSnapshot;
    }
  }

  return value;
};

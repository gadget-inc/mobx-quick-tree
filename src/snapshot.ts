import type { IStateTreeNode as MSTStateTreeNode } from "mobx-state-tree";
import { getSnapshot as mstGetSnapshot, isStateTreeNode as mstIsStateTreeNode } from "mobx-state-tree";
import { getType, isModelType, isReadOnlyNode, isReferenceType, isStateTreeNode } from "./api";
import { QuickArray } from "./array";
import { QuickMap } from "./map";
import { $identifier } from "./symbols";
import type { IAnyType, IStateTreeNode, SnapshotOut } from "./types";

export function getSnapshot<T extends IAnyType>(value: IStateTreeNode<T>): SnapshotOut<T> {
  if (mstIsStateTreeNode(value)) {
    return mstGetSnapshot(value as MSTStateTreeNode);
  }

  return snapshot(value) as SnapshotOut<T>;
}

// modeltype => snapshot cache
const cache = new WeakMap();

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
      // return a previously computed snapshot for a readonly node if it is available
      const cached = cache.get(value);
      if (cached) return cached;

      const modelSnapshot: Record<string, any> = {};
      for (const name in type.properties) {
        const propType = type.properties[name];
        if (isReferenceType(propType)) {
          const maybeRef = (value as any)[name];
          modelSnapshot[name] = maybeRef?.[$identifier];
        } else {
          modelSnapshot[name] = snapshot((value as any)[name]);
        }
      }
      cache.set(value, modelSnapshot);

      return modelSnapshot;
    }
  }

  return value;
};

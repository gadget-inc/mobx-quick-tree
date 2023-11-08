import type { IStateTreeNode as MSTStateTreeNode } from "mobx-state-tree";
import { getSnapshot as mstGetSnapshot, isStateTreeNode as mstIsStateTreeNode } from "mobx-state-tree";
import { getType, isModelType, isReferenceType, isStateTreeNode } from "./api";
import type { ArrayType } from "./array";
import { QuickArray } from "./array";
import type { MapType } from "./map";
import { QuickMap } from "./map";
import { $identifier } from "./symbols";
import type { IAnyType, IStateTreeNode, SnapshotOut } from "./types";
import type { SnapshottedViewMetadata } from "./class-model";

export function getSnapshot<T extends IAnyType>(value: IStateTreeNode<T>): SnapshotOut<T> {
  if (mstIsStateTreeNode(value)) {
    return mstGetSnapshot(value as MSTStateTreeNode);
  }

  return snapshot(value) as SnapshotOut<T>;
}

const snapshot = (value: any): unknown => {
  if (value instanceof QuickArray) {
    const type = getType(value) as ArrayType<IAnyType>;
    const childrenAreReferences = isReferenceType(type.childrenType);

    return Array.from(value.map((v) => (childrenAreReferences ? v[$identifier] : snapshot(v))));
  }

  if (value instanceof QuickMap) {
    const type = getType(value) as MapType<IAnyType>;
    const childrenAreReferences = isReferenceType(type.childrenType);

    return Object.fromEntries(
      Array.from(value.entries()).map(([k, v]) => {
        return [k, childrenAreReferences ? v[$identifier] : snapshot(v)];
      }),
    );
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
          const maybeRef = (value as any)[name];
          modelSnapshot[name] = maybeRef?.[$identifier];
        } else {
          modelSnapshot[name] = snapshot((value as any)[name]);
        }
      }
      if ("snapshottedViews" in type) {
        for (const view of type.snapshottedViews) {
          storeViewOnSnapshot(value, view, modelSnapshot);
        }
      }

      return modelSnapshot;
    }
  }

  return value;
};

/** @internal */
export const storeViewOnSnapshot = (node: Record<string, any>, view: SnapshottedViewMetadata, snapshot: any) => {
  let value = node[view.property];
  if (view.options.getSnapshot) {
    value = view.options.getSnapshot(value, snapshot, node);
  }
  snapshot[view.property] = value;
};

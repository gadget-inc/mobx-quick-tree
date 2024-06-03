import type { IAnyType, IStateTreeNode, SnapshotOut } from "./types";
import { SnapshottedViewMetadata } from "./class-model";
export declare function getSnapshot<T extends IAnyType>(value: IStateTreeNode<T>): SnapshotOut<T>;
/** @internal */
export declare const storeViewOnSnapshot: (node: Record<string, any>, view: SnapshottedViewMetadata, snapshot: any) => void;

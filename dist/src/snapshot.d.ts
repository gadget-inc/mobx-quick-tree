import type { IAnyType, IStateTreeNode, SnapshotOut } from "./types";
export declare function getSnapshot<T extends IAnyType, Snapshot = SnapshotOut<T>>(value: IStateTreeNode<T>): Snapshot;

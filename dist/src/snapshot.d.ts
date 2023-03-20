import type { IAnyType, IStateTreeNode, SnapshotOut } from "./types";
export declare function getSnapshot<T extends IAnyType>(value: IStateTreeNode<T>): SnapshotOut<T>;

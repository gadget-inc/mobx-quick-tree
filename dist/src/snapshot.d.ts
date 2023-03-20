import type { SnapshotOut } from "./types";
export declare function getSnapshot<Value, OutputType = SnapshotOut<Value>>(value: Value): OutputType;

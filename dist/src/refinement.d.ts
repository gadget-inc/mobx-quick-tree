import type { Instance } from "mobx-state-tree";
import type { IAnyType, InstanceWithoutSTNTypeForType, IType } from "./types";
export declare const refinement: <T extends IAnyType>(type: T, predicate: (snapshot: Instance<T> | Instance<T["mstType"]>) => boolean) => IType<T["InputType"], T["OutputType"], InstanceWithoutSTNTypeForType<T>>;

import { Instance } from "mobx-state-tree";
import type { IAnyType, IType } from "./types";
export declare const refinement: <T extends IAnyType>(type: T, predicate: (snapshot: T["InstanceType"] | Instance<T["mstType"]>) => boolean) => IType<T["InputType"], T["OutputType"], T["InstanceTypeWithoutSTN"]>;

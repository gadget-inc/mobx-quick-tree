import type { IDisposer, IAnyComplexType as MSTAnyComplexType, IAnyType as MSTAnyType } from "mobx-state-tree";
import type { FlowReturn } from "mobx-state-tree/dist/internal";
import type { CreateTypes, IAnyComplexType, IAnyModelType, IAnyStateTreeNode, IAnyType, IArrayType, IClassModelType, IMapType, IReferenceType, IStateTreeNode, IType, Instance, SnapshotIn } from "./types";
export { addDisposer, addMiddleware, applyPatch, clone, createActionTrackingMiddleware2, destroy, detach, escapeJsonPath, getIdentifier, getPath, getPathParts, hasParent, isActionContextThisOrChildOf, isAlive, isValidReference, joinJsonPath, onAction, onPatch, recordPatches, resolvePath, setLivelinessChecking, splitJsonPath, tryReference, typecheck, unescapeJsonPath, walk, } from "mobx-state-tree";
export { ClassModel, action, extend, register, view, cachedView, volatile, volatileAction } from "./class-model";
export { getSnapshot } from "./snapshot";
export declare const isType: (value: any) => value is IAnyType;
/**
 * Returns true if the given object is a complex type in observable mode
 * @param value any object
 * @returns
 */
export declare const isStateTreeNode: (value: any) => value is IStateTreeNode;
/**
 * Returns true if the given object is a complex type in readonly mode
 * @param value any object
 * @returns
 */
export declare const isReadOnlyNode: (value: any) => value is IStateTreeNode;
export declare const getParent: <T extends IAnyType>(value: IAnyStateTreeNode, depth?: number) => Instance<T>;
export declare function getParentOfType<T extends IAnyComplexType | MSTAnyComplexType>(value: IAnyStateTreeNode, type: T): Instance<T>;
export declare function getType(value: IAnyStateTreeNode): MSTAnyComplexType | IAnyComplexType;
export declare function getEnv<Env = any>(value: IAnyStateTreeNode): Env;
export declare const getRoot: <T extends IAnyType>(value: IAnyStateTreeNode) => Instance<T>;
export declare const isRoot: (value: IAnyStateTreeNode) => boolean;
export declare function resolveIdentifier<T extends IAnyModelType>(type: T, target: IStateTreeNode<IAnyType>, identifier: string): Instance<T> | undefined;
export declare const applySnapshot: <T extends IAnyType>(target: IStateTreeNode<T>, snapshot: SnapshotIn<T>) => void;
export declare const onSnapshot: <S>(target: IStateTreeNode<IType<any, S, any>> | IStateTreeNode<IClassModelType<any, any, S>>, callback: (snapshot: S) => void) => IDisposer;
export declare const isArrayType: (value: IAnyType | MSTAnyType) => value is IArrayType<IAnyType>;
export declare const isMapType: (value: IAnyType | MSTAnyType) => value is IMapType<IAnyType>;
export declare const isModelType: (value: IAnyType | MSTAnyType) => value is IAnyModelType;
export declare const isReferenceType: (value: IAnyType | MSTAnyType) => value is IReferenceType<IAnyComplexType>;
export declare const isIdentifierType: (value: IAnyType | MSTAnyType) => value is IReferenceType<IAnyComplexType>;
export declare function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export declare function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export declare function cast(snapshotOrInstance: never): never;
/**
 * Defines a new asynchronous action. `mobx-quick-tree` (and `mobx-state-tree`) require this wrapper around asynchronous actions, and require those action functions to be generators using `yield` instead of `await`.
 *
 * Accepts an incoming generator function and returns a new async function with the right mobx-state-tree wrapping.
 * See https://mobx-state-tree.js.org/concepts/async-actions for more info.
 */
export declare function flow<R, Args extends any[], This = unknown>(generator: (this: This, ...args: Args) => Generator<PromiseLike<any>, R, any>): (...args: Args) => Promise<FlowReturn<R>>;

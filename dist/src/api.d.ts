import type { IAnyComplexType as MSTAnyComplexType, IAnyType as MSTAnyType, IDisposer } from "mobx-state-tree";
import type { FlowReturn } from "mobx-state-tree/dist/internal";
import type { CreateTypes, IAnyComplexType, IAnyModelType, IAnyStateTreeNode, IAnyType, IArrayType, IMapType, Instance, IReferenceType, IStateTreeNode, IType } from "./types";
export { addDisposer, addMiddleware, applyPatch, clone, createActionTrackingMiddleware2, destroy, detach, escapeJsonPath, getIdentifier, getPath, getPathParts, hasParent, isActionContextThisOrChildOf, isAlive, isValidReference, joinJsonPath, onAction, onPatch, recordPatches, resolvePath, setLivelinessChecking, splitJsonPath, tryReference, typecheck, walk, } from "mobx-state-tree";
export { action, ClassModel, register, view } from "./class-model";
export { getSnapshot } from "./snapshot";
export declare const isType: (value: any) => value is IAnyType;
/**
 * Returns true if the given object is a complex type in observable mode
 * @param value any object
 * @returns
 */
export declare const isStateTreeNode: (value: any) => value is IStateTreeNode<IAnyType>;
/**
 * Returns true if the given object is a complex type in readonly mode
 * @param value any object
 * @returns
 */
export declare const isReadOnlyNode: (value: any) => value is IStateTreeNode<IAnyType>;
export declare const getParent: <T extends IAnyType>(value: IAnyStateTreeNode, depth?: number) => Instance<T>;
export declare function getParentOfType<T extends IAnyComplexType | MSTAnyComplexType>(value: IAnyStateTreeNode, type: T): Instance<T>;
export declare function getType(value: IAnyStateTreeNode): MSTAnyComplexType | IAnyComplexType;
export declare function getEnv<Env = any>(value: IAnyStateTreeNode): Env;
export declare const getRoot: <T extends IAnyType>(value: IAnyStateTreeNode) => Instance<T>;
export declare const isRoot: (value: IAnyStateTreeNode) => boolean;
export declare function resolveIdentifier<T extends IAnyModelType>(type: T, target: IStateTreeNode<IAnyType>, identifier: string): Instance<T> | undefined;
export declare const applySnapshot: <C>(target: IStateTreeNode<IType<C, any, any>>, snapshot: C) => void;
export declare const onSnapshot: <S>(target: IStateTreeNode<IType<any, S, any>>, callback: (snapshot: S) => void) => IDisposer;
export declare const isArrayType: (value: IAnyType | MSTAnyType) => value is IArrayType<IAnyType>;
export declare const isMapType: (value: IAnyType | MSTAnyType) => value is IMapType<IAnyType>;
export declare const isModelType: (value: IAnyType | MSTAnyType) => value is IAnyModelType;
export declare const isReferenceType: (value: IAnyType | MSTAnyType) => value is IReferenceType<IAnyComplexType>;
export declare const isIdentifierType: (value: IAnyType | MSTAnyType) => value is IReferenceType<IAnyComplexType>;
export declare function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export declare function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export declare function cast(snapshotOrInstance: never): never;
/**
 * Defines a new asynchronous action that uses `yield` instead of `await` for waiting for the results of promises
 *
 * Accepts an incoming generator function and returns a new async function with the right mobx-state-tree wrapping.
 */
export declare function flow<R, Args extends any[], This = unknown>(generator: (this: This, ...args: Args) => Generator<PromiseLike<any>, R, any>): (...args: Args) => Promise<FlowReturn<R>>;

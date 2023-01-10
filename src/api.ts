import type {
  IAnyComplexType as MSTAnyComplexType,
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  IDisposer,
  IStateTreeNode as MSTStateTreeNode,
} from "mobx-state-tree";
import {
  applySnapshot as mstApplySnapshot,
  flow as mstFlow,
  getEnv as mstGetEnv,
  getParent as mstGetParent,
  getParentOfType as mstGetParentOfType,
  getRoot as mstGetRoot,
  getType as mstGetType,
  isArrayType as mstIsArrayType,
  isIdentifierType as mstIsIdentifierType,
  isMapType as mstIsMapType,
  isModelType as mstIsModelType,
  isReferenceType as mstIsReferenceType,
  isRoot as mstIsRoot,
  isStateTreeNode as mstIsStateTreeNode,
  isType as mstIsType,
  onSnapshot as mstOnSnapshot,
  resolveIdentifier as mstResolveIdentifier,
} from "mobx-state-tree";
import type { FlowReturn } from "mobx-state-tree/dist/internal";
import { CantRunActionError } from "./errors";
import { $env, $parent, $quickType, $readOnly, $type } from "./symbols";
import type {
  CreateTypes,
  IAnyComplexType,
  IAnyModelType,
  IAnyStateTreeNode,
  IAnyType,
  IArrayType,
  IMapType,
  Instance,
  IReferenceType,
  IStateTreeNode,
  IType,
  SnapshotIn,
} from "./types";

export {
  addDisposer,
  addMiddleware,
  applyPatch,
  clone,
  createActionTrackingMiddleware2,
  destroy,
  detach,
  escapeJsonPath,
  getIdentifier,
  getPath,
  getPathParts,
  hasParent,
  isActionContextThisOrChildOf,
  isAlive,
  isValidReference,
  joinJsonPath,
  onAction,
  onPatch,
  recordPatches,
  resolvePath,
  setLivelinessChecking,
  splitJsonPath,
  tryReference,
  typecheck,
  walk,
} from "mobx-state-tree";
export { action, ClassModel, register, view } from "./class-model";
export { getSnapshot } from "./snapshot";

export const isType = (value: any): value is IAnyType => {
  return $quickType in value;
};

/**
 * Returns true if the given object is a complex type in observable mode
 * @param value any object
 * @returns
 */
export const isStateTreeNode = (value: any): value is IStateTreeNode => {
  if (mstIsStateTreeNode(value)) {
    return true;
  }

  return typeof value === "object" && value !== null && $type in value;
};

/**
 * Returns true if the given object is a complex type in readonly mode
 * @param value any object
 * @returns
 */
export const isReadOnlyNode = (value: any): value is IStateTreeNode => {
  return typeof value === "object" && value !== null && $readOnly in value;
};

export const getParent = <T extends IAnyType>(value: IAnyStateTreeNode, depth = 1): Instance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetParent(value, depth) as Instance<T>;
  }

  while (value && depth > 0) {
    value = value[$parent];
    depth -= 1;
  }

  if (!value) {
    throw new Error("failed to get parent");
  }

  return value;
};

export function getParentOfType<T extends IAnyComplexType | MSTAnyComplexType>(value: IAnyStateTreeNode, type: T): Instance<T> {
  if (mstIsStateTreeNode(value)) {
    if (mstIsType(type)) {
      return mstGetParentOfType(value, type);
    } else {
      return mstGetParentOfType(value, type.mstType) as Instance<T>;
    }
  }

  value = value[$parent];
  while (value) {
    if (type.is(value)) {
      break;
    }

    value = value[$parent];
  }

  if (!value) {
    throw new Error("failed to get parent");
  }

  return value;
}

export function getType(value: IAnyStateTreeNode): MSTAnyComplexType | IAnyComplexType {
  if (mstIsStateTreeNode(value)) {
    return mstGetType(value);
  }

  return value[$type];
}

export function getEnv<Env = any>(value: IAnyStateTreeNode): Env {
  if (mstIsStateTreeNode(value)) {
    return mstGetEnv(value);
  }

  // Assumes no cycles, otherwise this is an infinite loop
  let currentNode: IStateTreeNode = value;
  while (currentNode) {
    const env = (currentNode as any)[$env];
    if (env !== undefined) {
      return env;
    }

    currentNode = (currentNode as any)[$parent];
  }

  return {} as Env;
}

export const getRoot = <T extends IAnyType>(value: IAnyStateTreeNode): Instance<T> => {
  if (mstIsStateTreeNode(value)) {
    return mstGetRoot(value) as Instance<T>;
  }

  // Assumes no cycles, otherwise this is an infinite loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const newValue = value[$parent];
    if (newValue) {
      value = newValue;
    } else {
      return value;
    }
  }
};

export const isRoot = (value: IAnyStateTreeNode): boolean => {
  if (mstIsStateTreeNode(value)) {
    return mstIsRoot(value);
  }

  return value[$parent] === undefined;
};

export function resolveIdentifier<T extends IAnyModelType>(
  type: T,
  target: IStateTreeNode<IAnyType>,
  identifier: string
): Instance<T> | undefined {
  if (mstIsStateTreeNode(target)) {
    if (isType(type)) {
      return mstResolveIdentifier(type.mstType as MSTAnyModelType, target, identifier);
    } else {
      return mstResolveIdentifier(type, target, identifier);
    }
  }

  throw new Error("not yet implemented");
}

export const applySnapshot = <C>(target: IStateTreeNode<IType<C, any, any>>, snapshot: C): void => {
  if (mstIsStateTreeNode(target)) {
    mstApplySnapshot<C>(target as MSTStateTreeNode, snapshot);
    return;
  }

  throw new Error("can't apply a snapshot to a mobx-quick-tree node");
};

export const onSnapshot = <S>(target: IStateTreeNode<IType<any, S, any>>, callback: (snapshot: S) => void): IDisposer => {
  if (mstIsStateTreeNode(target)) {
    return mstOnSnapshot<S>(target as MSTStateTreeNode, callback);
  }

  throw new Error("can't use onSnapshot with a mobx-quick-tree node");
};

export const isArrayType = (value: IAnyType | MSTAnyType): value is IArrayType<IAnyType> => {
  if (mstIsType(value)) {
    return mstIsArrayType(value);
  }
  return mstIsArrayType(value.mstType);
};

export const isMapType = (value: IAnyType | MSTAnyType): value is IMapType<IAnyType> => {
  if (mstIsType(value)) {
    return mstIsMapType(value);
  }
  return mstIsMapType(value.mstType);
};

export const isModelType = (value: IAnyType | MSTAnyType): value is IAnyModelType => {
  if (mstIsType(value)) {
    return mstIsModelType(value);
  }
  return mstIsModelType(value.mstType);
};

export const isReferenceType = (value: IAnyType | MSTAnyType): value is IReferenceType<IAnyComplexType> => {
  if (mstIsType(value)) {
    return mstIsReferenceType(value);
  }
  return mstIsReferenceType(value.mstType);
};

export const isIdentifierType = (value: IAnyType | MSTAnyType): value is IReferenceType<IAnyComplexType> => {
  if (mstIsType(value)) {
    return mstIsIdentifierType(value);
  }
  return mstIsIdentifierType(value.mstType);
};

export function cast<O extends string | number | boolean | null | undefined = never>(snapshotOrInstance: O): O;
export function cast<O extends IAnyType>(snapshotOrInstance: CreateTypes<O>): O;
export function cast(snapshotOrInstance: never): never;
export function cast(snapshotOrInstance: any): any {
  return snapshotOrInstance;
}

/**
 * Defines a new asynchronous action that uses `yield` instead of `await` for waiting for the results of promises
 *
 * Accepts an incoming generator function and returns a new async function with the right mobx-state-tree wrapping.
 */
export function flow<R, T, Args extends any[]>(
  generator: (this: T, ...args: Args) => Generator<PromiseLike<any>, R, any>
): (...args: Args) => Promise<FlowReturn<R>> {
  // wrap the passed generator in a function which restores the correct value of `this`
  const wrappedGenerator = mstFlow(function* (args: Args, instance: T) {
    return yield* generator.call(instance, ...args);
  });

  // return an async function to set on the prototype which ensures the instance is not readonly
  return async function (this: T, ...args: Args): Promise<FlowReturn<R>> {
    if ((this?.constructor as any)?.isMQTClassModel) {
      throw new CantRunActionError(`Can't run flow action for a readonly instance`);
    }
    return await wrappedGenerator(args, this);
  };
}

/**
 * Create a new root instance of a type
 *
 * @param type The type to create. Can be any type
 * @param snapshot The snapshot of the type to create
 * @param readOnly If true, the instance will be readOnly and created faster
 * @param env The optional environment to decorate the whole tree with
 */
export const create = <T extends IAnyType>(type: T, snapshot?: SnapshotIn<T>, readOnly = false, env?: Record<string, any>): Instance<T> => {
  if (readOnly) {
    return type.createReadOnly(snapshot, env);
  } else {
    return type.create(snapshot, env);
  }
};

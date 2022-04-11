import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import {
  IAnyComplexType as MSTAnyComplexType,
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  IArrayType as MSTArrayType,
  IMapType as MSTMapType,
  IMaybe as MSTMaybeType,
  IMaybeNull as MSTMaybeNullType,
  IModelType as MSTModelType,
  Instance as MSTInstance_,
  IReferenceType as MSTReferenceType,
  ISimpleType as MSTSimpleType,
  IStateTreeNode as MSTStateTreeNode,
  SnapshotIn as MSTSnapshotIn,
  SnapshotOrInstance as MSTSnapshotOrInstance,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { $quickType, $type } from "./symbols";

export type {
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  IStateTreeNode as MSTStateTreeNode,
  ModelPropertiesDeclaration,
  ReferenceOptions,
  UnionOptions,
} from "mobx-state-tree";

export interface IType<InputType, OutputType, InstanceType, MSTType extends MSTAnyType> {
  readonly [$quickType]: undefined;

  readonly InputType: InputType;
  readonly OutputType: OutputType;
  readonly InstanceType: StateTreeNode<InstanceType, this>;
  readonly InstanceTypeWithoutSTN: InstanceType;

  readonly name: string;
  readonly mstType: MSTType;

  is(value: any): value is this["InputType"] | this["InstanceType"];
  create(snapshot?: InputType, env?: any): MSTInstance_<MSTType>;
  createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"];

  /** @hidden */
  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}

export type IAnyType = IType<any, any, any, MSTAnyType>;
export type ISimpleType<T> = IType<T, T, T, MSTSimpleType<T>>;
export type IAnyComplexType = IType<any, any, object, MSTAnyComplexType>;

export interface IModelType<Props extends ModelProperties, Others>
  extends IType<
    InputsForModel<InputTypesForModelProps<Props>>,
    OutputTypesForModelProps<Props>,
    InstanceTypesForModelProps<Props> & Others,
    MSTModelType<MSTPropertiesForModelProps<Props>, Others>
  > {
  readonly properties: Props;

  named(newName: string): IModelType<Props, Others>;
  props<Props2 extends ModelProperties>(props: Props2): IModelType<Props & Props2, Others>;
  views<V extends ModelViews>(fn: (self: Instance<this>) => V): IModelType<Props, Others & V>;
  actions<A extends ModelActions>(fn: (self: Instance<this>) => A): IModelType<Props, Others & A>;
  volatile<TP extends ModelViews>(fn: (self: Instance<this>) => TP): IModelType<Props, Others & TP>;
  extend<A extends ModelActions, V extends ModelViews, VS extends ModelViews>(
    fn: (self: Instance<this>) => {
      actions?: A;
      views?: V;
      state?: VS;
    }
  ): IModelType<Props, Others & A & V & VS>;
}

// This isn't quite IModelType<any, any>. In particular, InputType is any, which is key to make a lot of things typecheck
export interface IAnyModelType extends IType<any, any, any, MSTAnyModelType> {
  readonly properties: any;

  named(newName: string): IAnyModelType;
  props<Props2 extends ModelProperties>(props: Props2): IAnyModelType;
  views<V extends ModelViews>(fn: (self: Instance<this>) => V): IAnyModelType;
  actions<A extends ModelActions>(fn: (self: Instance<this>) => A): IAnyModelType;
  volatile<TP extends ModelViews>(fn: (self: Instance<this>) => TP): IAnyModelType;
  extend<A extends ModelActions, V extends ModelViews, VS extends ModelViews>(
    fn: (self: Instance<this>) => {
      actions?: A;
      views?: V;
      state?: VS;
    }
  ): IAnyModelType;
}

export type IMaybeType<T extends IAnyType> = IType<
  T["InputType"] | undefined,
  T["OutputType"] | undefined,
  T["InstanceTypeWithoutSTN"] | undefined,
  MSTMaybeType<T["mstType"]>
>;

export type IMaybeNullType<T extends IAnyType> = IType<
  T["InputType"] | null | undefined,
  T["OutputType"] | null,
  T["InstanceTypeWithoutSTN"] | null,
  MSTMaybeNullType<T["mstType"]>
>;

export type IReferenceType<T extends IAnyComplexType> = IType<string, string, T["InstanceTypeWithoutSTN"], MSTReferenceType<T["mstType"]>>;

export type IOptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> = IType<
  T["InputType"] | OptionalValues[number],
  T["OutputType"],
  T["InstanceTypeWithoutSTN"],
  T["mstType"]
>;

export type IMapType<T extends IAnyType> = IType<
  Record<string, T["InputType"]> | undefined,
  Record<string, T["OutputType"]>,
  IMSTMap<T>,
  MSTMapType<T["mstType"]>
>;

export type IArrayType<T extends IAnyType> = IType<
  Array<T["InputType"]> | undefined,
  T["OutputType"][],
  IMSTArray<T>,
  MSTArrayType<T["mstType"]>
>;

export type IUnionType<Types extends [IAnyType, ...IAnyType[]]> = IType<
  Types[number]["InputType"],
  Types[number]["OutputType"],
  Types[number]["InstanceTypeWithoutSTN"],
  Types[number]["mstType"]
>;

// Utility types

export interface IMSTArray<T extends IAnyType> extends Array<Instance<T>> {
  clear(): Instance<T>[];
  push(...items: CreateTypes<T>[]): number;
  concat(...items: (CreateTypes<T> | ConcatArray<CreateTypes<T>>)[]): Instance<T>[];
  remove(value: Instance<T>): boolean;
  replace(newItems: Instance<T>[]): Instance<T>[];
  splice(start: number, deleteCount?: number): Instance<T>[];
  splice(start: number, deleteCount: number, ...items: CreateTypes<T>[]): Instance<T>[];
  spliceWithArray(index: number, deleteCount?: number, newItems?: Instance<T>[]): Instance<T>[];
  toJSON(): Instance<T>[];
  unshift(...items: CreateTypes<T>[]): number;
}

export interface IMSTMap<T extends IAnyType> {
  readonly size: number;

  [Symbol.iterator](): IterableIterator<[string, Instance<T>]>;
  [Symbol.toStringTag]: "Map";

  clear(): void;
  delete(key: string): boolean;
  entries(): IterableIterator<[string, Instance<T>]>;
  forEach(callbackfn: (value: Instance<T>, key: string, map: this) => void, thisArg?: any): void;
  get(key: string): Instance<T> | undefined;
  has(key: string): boolean;
  intercept(handler: IInterceptor<IMapWillChange<string, Instance<T>>>): Lambda;
  keys(): IterableIterator<string>;
  merge(other: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
  observe(listener: (changes: IMapDidChange<string, Instance<T>>) => void, fireImmediately?: boolean): Lambda;
  put(value: CreateTypes<T>): Instance<T>;
  replace(values: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
  set(key: string, value: CreateTypes<T>): this;
  toJSON(): Record<string, MSTSnapshotOut<T["mstType"]>>;
  toString(): string;
  values(): IterableIterator<Instance<T>>;
}

/** @hidden */
export interface InstantiateContext {
  referenceCache: StateTreeNode<Record<string, object>, IAnyComplexType>;
  referencesToResolve: (() => void)[];
  env?: unknown;
}

export type SnapshotIn<T extends IAnyType> = T["InputType"];
export type SnapshotOut<T extends IAnyType> = T["OutputType"];
export type Instance<T> = T extends IAnyType ? T["InstanceType"] : T;
export type MSTInstance<T> = T extends IAnyType ? MSTInstance_<T["mstType"]> : MSTInstance_<T>;
export type QuickOrMSTInstance<T> = T extends IAnyType
  ? T["InstanceType"] | T["mstType"]
  : T extends MSTAnyType
  ? IQuickTreeNode<IType<MSTSnapshotIn<T>, MSTSnapshotOut<T>, T["TypeWithoutSTN"], T>> | MSTInstance_<T>
  : never;

export type SnapshotOrInstance<T> = T extends IAnyType
  ? T["InputType"] | T["InstanceType"]
  : T extends MSTAnyType
  ? MSTSnapshotOrInstance<T>
  : T;

export declare type CreateTypes<T extends IAnyType> = T["InputType"] | T["OutputType"] | T["InstanceType"];

export type ValidOptionalValue = string | boolean | number | null | undefined;
export type Primitives = string | number | boolean | Date | null | undefined;

export interface IQuickTreeNode<T extends IAnyType = IAnyType> {
  readonly [$type]: T;
  readonly [key: string | symbol]: any;
}

export type StateTreeNode<T, IT extends IAnyType> = T extends object ? T & IStateTreeNode<IT> : T;
export type IStateTreeNode<T extends IAnyType = IAnyType> = IQuickTreeNode<T> | MSTStateTreeNode<T["mstType"]>;
export type IAnyStateTreeNode = StateTreeNode<any, IAnyType>;

export type ModelProperties = Record<string, IAnyType>;
export type ModelActions = Record<string, Function>;
export type ModelViews = Record<string, unknown>;
export type EmptyObject = Record<string, unknown>; // not really an empty object, but `never` doesn't play nicely where this is used

export type InputTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["InputType"];
};

export type RequiredKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

export type InputsForModel<T> = {
  [K in RequiredKeys<T>]: T[K];
} & Partial<T>;

export type OutputTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["OutputType"];
};

export type InstanceTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["InstanceType"];
};

export type MSTPropertiesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["mstType"];
};

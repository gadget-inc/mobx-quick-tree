import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import {
  IAnyComplexType as AnyComplexMSTType,
  IAnyType as AnyMSTType,
  IArrayType as MSTArrayType,
  IMapType as MSTMapType,
  IMaybe as MSTMaybeType,
  IMaybeNull as MSTMaybeNullType,
  IModelType as MSTModelType,
  Instance as MSTInstance,
  IReferenceType as MSTReferenceType,
  ISimpleType as MSTSimpleType,
  IStateTreeNode as MSTStateTreeNode,
  SnapshotOrInstance as MSTSnapshotOrInstance,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { ExtractCSTWithSTN } from "mobx-state-tree/dist/internal";
import { $quickType, $type } from "./symbols";

export {
  IJsonPatch,
  IMiddlewareEvent,
  IPatchRecorder,
  IStateTreeNode as MSTStateTreeNode,
  ModelPropertiesDeclaration,
  ReferenceOptions,
  UnionOptions,
} from "mobx-state-tree";

export interface IType<InputType, OutputType, InstanceType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;

  readonly InputType: InputType;
  readonly OutputType: OutputType;
  readonly InstanceType: StateTreeNode<InstanceType, this>;

  readonly name: string;
  readonly mstType: MSTType;

  is(value: any): value is InputType | this["InstanceType"] | MSTSnapshotOrInstance<MSTType>;
  create(snapshot?: InputType, env?: any): MSTInstance<MSTType>;
  createReadOnly(snapshot?: InputType): this["InstanceType"];

  /** @hidden */
  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}

export type IAnyType = IType<any, any, any, AnyMSTType>;
export type ISimpleType<T> = IType<T, T, T, MSTSimpleType<T>>;
export type IAnyModelType = IModelType<any, any>;
export type IAnyComplexType = IType<any, any, any, AnyComplexMSTType>;

export interface IModelType<Props extends ModelProperties, Others>
  extends IType<
    InputTypesForModelProps<Props>,
    OutputTypesForModelProps<Props>,
    InstanceTypesForModelProps<Props> & Others,
    MSTModelType<MSTPropertiesForModelProps<Props>, Others>
  > {
  readonly properties: Props;

  named(newName: string): IModelType<Props, Others>;
  props<Props2 extends ModelProperties>(props: Props2): IModelType<Props & Props2, Others>;
  views<V extends Record<string, unknown>>(fn: (self: Instance<this>) => V): IModelType<Props, Others & V>;
  actions<A extends ModelActions>(fn: (self: Instance<this>) => A): IModelType<Props, Others & A>;
  volatile<TP extends object>(fn: (self: Instance<this>) => TP): IModelType<Props, Others & TP>;
  extend<A extends ModelActions = {}, V extends Object = {}, VS extends Object = {}>(
    fn: (self: Instance<this>) => {
      actions?: A;
      views?: V;
      state?: VS;
    }
  ): IModelType<Props, Others & A & V & VS>;
}

export type IMaybeType<T extends IAnyType> = IType<
  T["InputType"] | undefined,
  T["OutputType"] | undefined,
  T["InstanceType"] | undefined,
  MSTMaybeType<T["mstType"]>
>;

export type IMaybeNullType<T extends IAnyType> = IType<
  T["InputType"] | null | undefined,
  T["OutputType"] | null,
  T["InstanceType"] | null,
  MSTMaybeNullType<T["mstType"]>
>;

export type IReferenceType<T extends IAnyComplexType> = IType<
  string,
  string,
  T["InstanceType"],
  MSTReferenceType<T["mstType"]>
>;

export type IOptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> = IType<
  T["InputType"] | OptionalValues[number],
  T["OutputType"],
  T["InstanceType"],
  T["mstType"]
>;

export type IMapType<T extends IAnyType> = IType<
  Record<string, T["InputType"]>,
  Record<string, T["OutputType"]>,
  IMSTMap<T>,
  MSTMapType<T["mstType"]>
>;

export type IArrayType<T extends IAnyType> = IType<
  ReadonlyArray<T["InputType"]>,
  T["OutputType"][],
  IMSTArray<T>,
  MSTArrayType<T["mstType"]>
>;

export type IUnionType<Types extends [IAnyType, ...IAnyType[]]> = IType<
  Types[number]["InputType"],
  Types[number]["OutputType"],
  Types[number]["InstanceType"],
  Types[number]["mstType"]
>;

// Utility types

export interface IMSTArray<T extends IAnyType> extends Array<QuickOrMSTInstance<T>> {
  clear(): QuickOrMSTInstance<T>[];
  push(...items: CreateTypes<T>[]): number;
  concat(...items: (CreateTypes<T> | ConcatArray<CreateTypes<T>>)[]): QuickOrMSTInstance<T>[];
  remove(value: QuickOrMSTInstance<T>): boolean;
  replace(newItems: QuickOrMSTInstance<T>[]): QuickOrMSTInstance<T>[];
  splice(start: number, deleteCount?: number): QuickOrMSTInstance<T>[];
  splice(start: number, deleteCount: number, ...items: CreateTypes<T>[]): QuickOrMSTInstance<T>[];
  spliceWithArray(index: number, deleteCount?: number, newItems?: QuickOrMSTInstance<T>[]): QuickOrMSTInstance<T>[];
  toJSON(): QuickOrMSTInstance<T>[];
  unshift(...items: CreateTypes<T>[]): number;
}

export interface IMSTMap<T extends IAnyType> {
  readonly size: number;

  [Symbol.iterator](): IterableIterator<[string, QuickOrMSTInstance<T>]>;
  [Symbol.toStringTag]: "Map";

  clear(): void;
  delete(key: string): boolean;
  entries(): IterableIterator<[string, QuickOrMSTInstance<T>]>;
  forEach(callbackfn: (value: QuickOrMSTInstance<T>, key: string, map: this) => void, thisArg?: any): void;
  get(key: string): QuickOrMSTInstance<T> | undefined;
  has(key: string): boolean;
  intercept(handler: IInterceptor<IMapWillChange<string, QuickOrMSTInstance<T>>>): Lambda;
  keys(): IterableIterator<string>;
  merge(other: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
  observe(listener: (changes: IMapDidChange<string, QuickOrMSTInstance<T>>) => void, fireImmediately?: boolean): Lambda;
  put(value: CreateTypes<T>): QuickOrMSTInstance<T>;
  replace(values: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
  set(key: string, value: CreateTypes<T>): this;
  toJSON(): Record<string, MSTSnapshotOut<T["mstType"]>>;
  toString(): string;
  values(): IterableIterator<QuickOrMSTInstance<T>>;
}

/** @hidden */
export interface InstantiateContext {
  referenceCache: StateTreeNode<Record<string, object>, IAnyComplexType>;
  referencesToResolve: (() => void)[];
}

export type SnapshotIn<T extends IAnyType> = T["InputType"]; // | MSTSnapshotIn<T["mstType"]>;
export type SnapshotOut<T extends IAnyType> = T["OutputType"]; // | MSTSnapshotOut<T["mstType"]>;
export type Instance<T> = T extends IAnyType ? T["InstanceType"] : T;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | MSTInstance<T["mstType"]>;

export type SnapshotOrInstance<T> = T extends IAnyType
  ? T["InputType"] | T["InstanceType"] | MSTSnapshotOrInstance<T["mstType"]>
  : T extends AnyMSTType
  ? MSTSnapshotOrInstance<T>
  : T;

export declare type CreateTypes<T extends IAnyType> =
  | T["InputType"]
  | T["OutputType"]
  | T["InstanceType"]
  | ExtractCSTWithSTN<T["mstType"]>;

export type ValidOptionalValue = string | boolean | number | null | undefined;
export type FuncOrValue<T> = T | (() => T);
export type Primitives = string | number | boolean | Date | null | undefined;

export interface IQuickTreeNode<T extends IAnyType = IAnyType> {
  readonly [$type]: T;
}

export type StateTreeNode<T, IT extends IAnyType> = T extends object ? T & IStateTreeNode<IT> : T;
export type IStateTreeNode<T extends IAnyType = IAnyType> = IQuickTreeNode<T> | MSTStateTreeNode<T["mstType"]>;
export interface IAnyStateTreeNode extends StateTreeNode<any, IAnyType> {}

export interface ModelProperties {
  [key: string]: IAnyType;
}

export type ModelActions = Record<string, Function>;

export type InputTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]?: T[K]["InputType"];
};

export type OutputTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["OutputType"];
};

export type InstanceTypesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["InstanceType"];
};

export type MSTPropertiesForModelProps<T extends ModelProperties> = {
  [K in keyof T]: T[K]["mstType"];
};

import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import {
  IAnyComplexType as AnyComplexMSTType,
  IAnyType as AnyMSTType,
  IArrayType as MSTArrayType,
  IMapType as MSTMapType,
  IMaybe as MSTMaybeType,
  IMaybeNull as MSTMaybeNullType,
  Instance as MSTInstance,
  IReferenceType as MSTReferenceType,
  ISimpleType as MSTSimpleType,
  IStateTreeNode as IMSTStateTreeNode,
  SnapshotOrInstance as MSTSnapshotOrInstance,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { ExtractCSTWithSTN } from "mobx-state-tree/dist/internal";
import { ModelType } from "./model";
import { $quickType, $type } from "./symbols";

export { IStateTreeNode as MSTStateTreeNode, ModelPropertiesDeclaration, ReferenceOptions } from "mobx-state-tree";

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

export interface IType<InputType, OutputType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;

  readonly InputType: InputType;
  readonly OutputType: OutputType;
  readonly InstanceType: StateTreeNode<OutputType, this>;

  readonly name: string;
  readonly mstType: AnyMSTType;

  is(value: any): value is QuickOrMSTInstance<this>;
  create(snapshot?: InputType, env?: any): MSTInstance<MSTType>;
  createReadOnly(snapshot?: InputType): OutputType;

  /** @hidden */
  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): OutputType;
}

export type ValidOptionalValue = string | boolean | number | null | undefined;
export type FuncOrValue<T> = T | (() => T);
export type Primitives = string | number | boolean | Date | null | undefined;

export type IAnyType = IType<any, any, AnyMSTType>;
export type IAnyComplexType = IType<any, any, AnyComplexMSTType>;
export type IModelType<Props extends ModelProperties, Others> = ModelType<Props, Others>;
export type IAnyModelType = IModelType<any, any>;
export type ISimpleType<T> = IType<T, T, MSTSimpleType<T>>;

export type IMaybeType<T extends IAnyType> = IType<
  T["InputType"] | undefined,
  T["InstanceType"] | undefined,
  MSTMaybeType<T["mstType"]>
>;

export type IMaybeNullType<T extends IAnyType> = IType<
  T["InputType"] | null,
  T["InstanceType"] | null,
  MSTMaybeNullType<T["mstType"]>
>;

export type IReferenceType<T extends IAnyComplexType> = IType<
  string,
  T["InstanceType"],
  MSTReferenceType<T["mstType"]>
>;

export type IOptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> = IType<
  T["InputType"] | OptionalValues[number],
  T["InstanceType"],
  T["mstType"]
>;

export type IMapType<T extends IAnyType> = IType<Record<string, T["InputType"]>, IMSTMap<T>, MSTMapType<T["mstType"]>>;

export type IArrayType<T extends IAnyType> = IType<
  ReadonlyArray<T["InputType"]>,
  IMSTArray<T>,
  MSTArrayType<T["mstType"]>
>;

export declare type CreateTypes<T extends IAnyType> =
  | T["InputType"]
  | T["OutputType"]
  | T["InstanceType"]
  | ExtractCSTWithSTN<T["mstType"]>;

export type SnapshotIn<T extends IAnyType> = T["InputType"];
export type SnapshotOut<T extends IAnyType> = MSTSnapshotOut<T["mstType"]>;
export type Instance<T> = T extends IAnyType ? T["InstanceType"] : T;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | MSTInstance<T["mstType"]>;

export type SnapshotOrInstance<T> = T extends IAnyType
  ? T["InputType"] | T["InstanceType"] | MSTSnapshotOrInstance<T["mstType"]>
  : T extends AnyMSTType
  ? MSTSnapshotOrInstance<T>
  : T;

export type ModelProperties = Record<string, IAnyType>;
export type ModelActions = Record<string, Function>;

export type ModelCreationProps<T extends ModelProperties> = {
  [K in keyof T]?: T[K]["InputType"];
};

export type InstanceTypes<T extends ModelProperties> = {
  [K in keyof T]: T[K]["InstanceType"];
};

export type MSTProperties<T extends ModelProperties> = {
  [K in keyof T]: T[K]["mstType"];
};

export interface IQuickTreeNode<T extends IAnyType = IAnyType> {
  readonly [$type]: T;
}

export type StateTreeNode<T, IT extends IAnyType> = T extends object ? T & IStateTreeNode<IT> : T;
export type IStateTreeNode<T extends IAnyType = IAnyType> = IQuickTreeNode<T> | IMSTStateTreeNode<T["mstType"]>;
export interface IAnyStateTreeNode extends StateTreeNode<any, IAnyType> {}

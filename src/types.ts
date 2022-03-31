import {
  IAnyComplexType as AnyComplexMSTType,
  IAnyType as AnyMSTType,
  IArrayType as MSTArrayType,
  IMapType as MSTMapType,
  IMaybe as MSTMaybeType,
  IMaybeNull as MSTMaybeNullType,
  IMSTArray,
  IMSTMap,
  Instance as MSTInstance,
  IReferenceType as MSTReferenceType,
  ISimpleType as MSTSimpleType,
  IStateTreeNode as IMSTStateTreeNode,
  SnapshotOrInstance as MSTSnapshotOrInstance,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { ModelType } from "./model";
import { $quickType, $type } from "./symbols";

export {
  IMSTArray,
  IMSTMap,
  IStateTreeNode as MSTStateTreeNode,
  ModelPropertiesDeclaration,
  ReferenceOptions,
} from "mobx-state-tree";

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

export type IMapType<T extends IAnyType> = IType<
  Record<string, T["InputType"]>,
  IMSTMap<T["mstType"]>,
  MSTMapType<T["mstType"]>
>;

export type IArrayType<T extends IAnyType> = IType<
  ReadonlyArray<T["InputType"]>,
  IMSTArray<T["mstType"]>,
  MSTArrayType<T["mstType"]>
>;

export type SnapshotIn<T extends IAnyType> = T["InputType"];
export type SnapshotOut<T extends IAnyType> = MSTSnapshotOut<T["mstType"]>;
export type Instance<T> = T extends IAnyType ? T["InstanceType"] : T;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | MSTInstance<T["mstType"]>;

export type SnapshotOrInstance<T> = T extends IAnyType
  ? T["InputType"] | T["InstanceType"]
  : T extends AnyMSTType
  ? MSTSnapshotOrInstance<T>
  : never;

export type ModelProperties = {
  [key: string]: IAnyType;
};

export type ModelActions = {
  [key: string]: Function;
};

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

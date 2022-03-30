import type {
  IAnyComplexType as AnyComplexMSTType,
  IAnyType as AnyMSTType,
  Instance as MSTInstance,
  ISimpleType as MSTSimpleType,
  IStateTreeNode as IMSTStateTreeNode,
  SnapshotOut as MSTSnapshotOut,
} from "mobx-state-tree";
import { BaseType } from "./base";
import { ModelType } from "./model";
import { $type } from "./symbols";

export { IMSTArray, ModelPropertiesDeclaration } from "mobx-state-tree";

export type ValidOptionalValue = string | boolean | number | null | undefined;
export type FuncOrValue<T> = T | (() => T);
export type Primitives = string | number | boolean | Date | null | undefined;

export type IAnyType = BaseType<any, any, AnyMSTType>;
export type IAnyComplexType = BaseType<any, any, AnyComplexMSTType>;
export type IModelType<Props extends ModelProperties, Others> = ModelType<Props, Others>;
export type IAnyModelType = IModelType<any, any>;
export type ISimpleType<T> = BaseType<T, T, MSTSimpleType<T>>;
export type IOptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> = BaseType<
  T["InputType"] | OptionalValues,
  T["InstanceType"],
  T["mstType"]
>;

export type SnapshotIn<T extends IAnyType> = T["InputType"];
export type SnapshotOut<T extends IAnyType> = MSTSnapshotOut<T["mstType"]>;
export type Instance<T extends IAnyType> = T["InstanceType"];
export type SnapshotOrInstance<T extends IAnyType> = T["InputType"] | T["InstanceType"];
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | MSTInstance<T["mstType"]>;

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

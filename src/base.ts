import { IAnyType as AnyMSTType, Instance } from "mobx-state-tree";
import { $quickType } from "./symbols";

export abstract class BaseType<InputType, InstanceType, MSTType extends AnyMSTType> {
  readonly [$quickType]: undefined;
  readonly InputType: InputType;
  readonly InstanceType: InstanceType;

  constructor(readonly name: string, readonly mstType: MSTType) {}

  create(snapshot?: this["InputType"], env?: any): Instance<MSTType> {
    return this.mstType.create(snapshot, env);
  }

  is(value: any): value is QuickOrMSTInstance<this> {
    return this.mstType.is(value);
  }

  abstract createReadOnly(snapshot?: InputType): InstanceType;
}

export type IAnyType = BaseType<any, any, any>;
export type QuickOrMSTInstance<T extends IAnyType> = T["InstanceType"] | Instance<T["mstType"]>;

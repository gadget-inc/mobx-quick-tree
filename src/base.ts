import { IAnyType, Instance } from "mobx-state-tree";
import { $quickType } from "./symbols";

export abstract class BaseType<InputType, InstanceType, MSTType extends IAnyType> {
  readonly [$quickType]: undefined;
  readonly InputType: InputType;
  readonly InstanceType: InstanceType;
  readonly CreateType: InstanceType | Instance<MSTType>;

  constructor(readonly name: string, readonly mstType: MSTType) {}

  create(snapshot?: this["InputType"], env?: any): Instance<MSTType> {
    return this.mstType.create(snapshot, env);
  }

  is(value: any): value is this["CreateType"] {
    return this.mstType.is(value);
  }

  abstract createReadOnly(snapshot?: InputType): InstanceType;
}

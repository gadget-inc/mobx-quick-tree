import { IAnyType, Instance } from "mobx-state-tree";

const $quickType = Symbol.for("quickType");

export abstract class BaseType<InputType, InstanceType, MSTType extends IAnyType> {
  readonly [$quickType]: undefined;
  readonly InputType: InputType;
  readonly InstanceType: InstanceType;
  readonly CreateType: InstanceType | Instance<MSTType>;

  constructor(readonly name: string, readonly mstType: MSTType) {}

  create(snapshot?: this["InputType"], env?: any): Instance<MSTType> {
    return this.mstType.create(snapshot, env);
  }

  abstract createReadOnly(snapshot?: InputType): InstanceType;
}

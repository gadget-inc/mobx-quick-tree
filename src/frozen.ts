import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import { InstantiateContext, ISimpleType } from "./types";

export class FrozenType<T> extends BaseType<T, T, T> {
  constructor() {
    super("frozen", types.frozen<T>());
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    return snapshot as this["InstanceType"];
  }
}

export const frozen = <T = any>(): ISimpleType<T> => {
  return new FrozenType<T>();
};

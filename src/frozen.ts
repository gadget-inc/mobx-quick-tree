import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import { InstantiateContext, ISimpleType } from "./types";

class FrozenType<T> extends BaseType<T, T, T> {
  constructor() {
    super(types.frozen<T>());
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (typeof snapshot == "function") {
      throw new Error("frozen types can't be instantiated with functions");
    }
    return snapshot as this["InstanceType"];
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    // Valid values for frozen types have to be serializable
    return typeof value !== "function";
  }
}

export const frozen = <T = any>(): ISimpleType<T> => {
  return new FrozenType<T>();
};

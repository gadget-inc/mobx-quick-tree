import type { IAnyType as MSTAnyType } from "mobx-state-tree";
import { QuickArray } from "./array";
import { $env, $parent, $quickType, $type } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, InstantiateContext, StateTreeNode } from "./types";

export abstract class BaseType<InputType, OutputType, InstanceType> {
  readonly [$quickType] = undefined;

  readonly InputType!: InputType;
  readonly OutputType!: OutputType;
  readonly InstanceType!: StateTreeNode<InstanceType, this>;
  readonly InstanceTypeWithoutSTN!: InstanceType;

  readonly name: string;
  readonly mstType!: MSTAnyType;

  constructor(mstType: MSTAnyType) {
    this.name = mstType.name;

    Object.defineProperty(this, "mstType", {
      value: mstType,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  create(snapshot?: this["InputType"], env?: any): this["InstanceType"] {
    return this.mstType.create(snapshot, env);
  }

  abstract is(value: IAnyStateTreeNode): value is this["InstanceType"];
  abstract is(value: any): value is this["InputType"] | this["InstanceType"];

  createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"] {
    const context: InstantiateContext = {
      referenceCache: new Map(),
      referencesToResolve: [],
      env,
    };

    const instance = this.instantiate(snapshot, context);
    for (const resolver of context.referencesToResolve) {
      resolver();
    }

    const maybeObjectInstance: any = instance;
    if (typeof maybeObjectInstance === "object" && maybeObjectInstance !== null) {
      maybeObjectInstance[$env] = env
    }

    return instance;
  }

  abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}

/** @hidden */
export const setType = (value: any, type: IAnyType) => {
  if (value && typeof value == "object") {
    if (value instanceof QuickArray) {
      Object.defineProperty(value, $type, {
        value: type,
        enumerable: false,
        writable: false
      })
    } else {
      value[$type] = type;
    }
  }
};

/** @hidden */
export const setParent = (value: any, parent: any) => {
  if (value && typeof value == "object" && !value[$parent]) {
    if (value instanceof QuickArray) {
      Object.defineProperty(value, $parent, {
        value: parent,
        enumerable: false,
        writable: false
      })
    } else {
      value[$parent] = parent
    }

  }
};

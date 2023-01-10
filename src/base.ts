import type { IAnyType as MSTAnyType } from "mobx-state-tree";
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

  /**
   * @deprecated Prefer the top level `create` function instead
   */
  create(snapshot?: this["InputType"], env?: any): this["InstanceType"] {
    return this.mstType.create(snapshot, env);
  }

  abstract is(value: IAnyStateTreeNode): value is this["InstanceType"];
  abstract is(value: any): value is this["InputType"] | this["InstanceType"];

  /**
   * @deprecated Prefer the top level `create` function instead
   */
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

    setEnv(instance, env);

    return instance;
  }

  abstract instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}

/** @hidden */
export const setType = (value: unknown, type: IAnyType) => {
  if (value && typeof value == "object") {
    Reflect.defineProperty(value, $type, {
      value: type,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

/** @hidden */
export const setParent = (value: unknown, parent: any) => {
  if (value && typeof value == "object") {
    Reflect.defineProperty(value, $parent, {
      value: parent,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

/** @hidden */
export const setEnv = (instance: unknown, env: any) => {
  if (typeof instance === "object" && instance !== null) {
    Reflect.defineProperty(instance, $env, {
      value: env,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
};

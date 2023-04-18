import type { IAnyType as MSTAnyType } from "mobx-state-tree";
import { $env, $parent, $quickType, $type } from "./symbols";
import type { IAnyStateTreeNode, IAnyType, IStateTreeNode, InstantiateContext, StateTreeNode } from "./types";

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
   * Create a new instance of this class model in observable mode. Uses an `mobx-state-tree` type under the hood.
   */
  create(snapshot?: this["InputType"], env?: any): this["InstanceType"] {
    return this.mstType.create(snapshot, env);
  }

  abstract is(value: IAnyStateTreeNode): value is this["InstanceType"];
  abstract is(value: any): value is this["InputType"] | this["InstanceType"];

  /**
   * Create a new instance of this class model in readonly mode. Properties and views are accessible on readonly instances but actions will throw if run.
   */
  createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"] {
    const context: InstantiateContext = {
      referenceCache: new Map(),
      referencesToResolve: [],
      env,
    };

    const instance = this.instantiate(snapshot, context, null);
    for (const resolver of context.referencesToResolve) {
      resolver();
    }

    setEnv(instance, env);

    return instance;
  }

  abstract instantiate(
    snapshot: this["InputType"] | undefined,
    context: InstantiateContext,
    parent: IStateTreeNode | null
  ): this["InstanceType"];
}

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

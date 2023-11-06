import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { isStateTreeNode, types } from "mobx-state-tree";
import { BaseType } from "./base";
import { ensureRegistered } from "./class-model";
import { getSnapshot } from "./snapshot";
import { $env, $parent, $readOnly, $type } from "./symbols";
import type {
  CreateTypes,
  IAnyStateTreeNode,
  IAnyType,
  IMSTMap,
  IMapType,
  IStateTreeNode,
  Instance,
  InstantiateContext,
  SnapshotOut,
} from "./types";

export class QuickMap<T extends IAnyType> extends Map<string, Instance<T>> implements IMSTMap<T> {
  static get [Symbol.species]() {
    return Map;
  }

  /** @hidden */
  readonly [$env]?: any;
  /** @hidden */
  readonly [$parent]?: IStateTreeNode | null;
  /** @hidden */
  readonly [$type]?: [this] | [any];

  constructor(type: any, parent: IStateTreeNode | null, env: any) {
    super();
    this[$type] = type;
    this[$parent] = parent;
    this[$env] = env;
  }

  get [Symbol.toStringTag]() {
    return "Map" as const;
  }

  get [$readOnly]() {
    return true;
  }

  forEach(callbackfn: (value: Instance<T>, key: string, map: this) => void, thisArg?: any): void {
    super.forEach((value, key) => callbackfn(value, key, thisArg ?? this));
  }

  put(_value: CreateTypes<T>): Instance<T> {
    throw new Error("put not supported in QuickMap");
  }

  merge(_other: any): this {
    throw new Error("merge not supported in QuickMap");
  }

  replace(_values: any): this {
    throw new Error("replace not supported in QuickMap");
  }

  toJSON(): Record<string, SnapshotOut<T>> {
    return getSnapshot(this);
  }

  observe(_listener: (changes: IMapDidChange<string, Instance<T>>) => void, _fireImmediately?: boolean): Lambda {
    throw new Error("observer not supported in QuickMap");
  }

  intercept(_handler: IInterceptor<IMapWillChange<string, Instance<T>>>): Lambda {
    throw new Error("intercept not supported in QuickMap");
  }
}

export class MapType<T extends IAnyType> extends BaseType<
  Record<string, T["InputType"]> | undefined,
  Record<string, T["OutputType"]>,
  IMSTMap<T>
> {
  constructor(readonly childrenType: T) {
    super(types.map(childrenType.mstType));
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (isStateTreeNode(value)) {
      return this.mstType.is(value);
    }

    if (value === undefined) {
      return true;
    }

    if (typeof value !== "object" || value === null) {
      return false;
    }

    if (!(value instanceof QuickMap) && Object.getPrototypeOf(value) != Object.prototype) {
      return false;
    }

    if (value[$type] === this) {
      return true;
    }

    const children = Object.values(value as object);
    return children.every((child) => this.childrenType.is(child));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext, parent: IStateTreeNode | null): this["InstanceType"] {
    const map = new QuickMap<T>(this, parent, context.env);
    if (snapshot) {
      for (const key in snapshot) {
        const item = this.childrenType.instantiate(snapshot[key], context, map);
        map.set(key, item);
      }
    }

    return map as this["InstanceType"];
  }

  async schemaHash() {
    return `map:${await this.childrenType.schemaHash()}`;
  }
}

export const map = <T extends IAnyType>(childrenType: T): IMapType<T> => {
  ensureRegistered(childrenType);
  return new MapType(childrenType);
};

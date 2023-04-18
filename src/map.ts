import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { isStateTreeNode, types } from "mobx-state-tree";
import { BaseType, setParent } from "./base";
import { ensureRegistered } from "./class-model";
import { getSnapshot } from "./snapshot";
import { $readOnly, $type } from "./symbols";
import type { CreateTypes, IAnyStateTreeNode, IAnyType, IMSTMap, IMapType, Instance, InstantiateContext, SnapshotOut } from "./types";

export class QuickMap<T extends IAnyType> extends Map<string, Instance<T>> implements IMSTMap<T> {
  static get [Symbol.species]() {
    return Map;
  }

  constructor(type: any) {
    super();
    this[$type] = type;
  }

  [$type]?: [this] | [any];

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

class MapType<T extends IAnyType> extends BaseType<
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

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const map = new QuickMap<T>(this);
    if (snapshot) {
      for (const key in snapshot) {
        const item = this.childrenType.instantiate(snapshot[key], context);
        setParent(item, map);
        map.set(key, item);
      }
    }

    return map as this["InstanceType"];
  }
}

export const map = <T extends IAnyType>(childrenType: T): IMapType<T> => {
  ensureRegistered(childrenType);
  return new MapType(childrenType);
};

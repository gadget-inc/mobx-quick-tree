import { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { IMapType as MSTMapType, SnapshotOut as MSTSnapshotOut, types } from "mobx-state-tree";
import { BaseType, setParent, setType } from "./base";
import { $identifier } from "./symbols";
import type { CreateTypes, IAnyType, IMapType, IMSTMap, Instance, InstantiateContext } from "./types";

export class QuickMap<T extends IAnyType> extends Map<string, T["InstanceType"]> implements IMSTMap<T> {
  static get [Symbol.species]() {
    return Map;
  }

  [Symbol.toStringTag]: "Map";

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

  toJSON(): Record<string, MSTSnapshotOut<T["mstType"]>> {
    return Object.fromEntries(super.entries());
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
  IMSTMap<T>,
  MSTMapType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`map<${childrenType.name}>`, types.map(childrenType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const map = new QuickMap<T>();
    if (snapshot) {
      Object.entries(snapshot).forEach(([key, value]) => {
        const item = this.childrenType.instantiate(value, context);
        setParent(item, map);
        map.set(item[$identifier] ?? key, item);
      });
    }

    setType(map, this);

    return map;
  }
}

export const map = <T extends IAnyType>(childrenType: T): IMapType<T> => {
  return new MapType(childrenType);
};

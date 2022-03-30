import { IInterceptor, IKeyValueMap, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import { IAnyType as IAnyMSTType, IMapType, IMSTMap, types } from "mobx-state-tree";
import { ExtractCSTWithSTN } from "mobx-state-tree/dist/internal";
import { BaseType, InstantiateContext, setParent, setType } from "./base";
import { $identifier } from "./symbols";
import type { IAnyType } from "./types";

export class QuickMap<T, M extends IAnyMSTType> extends Map<string, T> implements IMSTMap<M> {
  static get [Symbol.species]() {
    return Map;
  }

  [Symbol.toStringTag]: "Map";

  forEach(callbackfn: (value: M["Type"], key: string, map: this) => void, thisArg?: any): void {
    super.forEach((value, key) => callbackfn(value, key, this));
  }

  put(_value: ExtractCSTWithSTN<M>): M["Type"] {
    throw new Error("put not supported in QuickMap");
  }

  merge(_other: any): this {
    throw new Error("merge not supported in QuickMap");
  }

  replace(_values: any): this {
    throw new Error("replace not supported in QuickMap");
  }

  toJSON(): IKeyValueMap<M["SnapshotType"]> {
    return Object.fromEntries(super.entries());
  }

  observe(_listener: (changes: IMapDidChange<string, M["Type"]>) => void, _fireImmediately?: boolean): Lambda {
    throw new Error("observer not supported in QuickMap");
  }

  intercept(_handler: IInterceptor<IMapWillChange<string, M["Type"]>>): Lambda {
    throw new Error("intercept not supported in QuickMap");
  }
}

export class MapType<T extends IAnyType> extends BaseType<
  Record<string, T["InputType"]>,
  QuickMap<T["InstanceType"], T["mstType"]>,
  IMapType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`map<${childrenType.name}>`, types.map(childrenType.mstType));
  }

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const map = new QuickMap<T["InstanceType"], T["mstType"]>();
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

export const map = <T extends IAnyType>(childrenType: T): MapType<T> => {
  return new MapType(childrenType);
};

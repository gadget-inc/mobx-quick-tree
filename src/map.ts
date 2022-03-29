import { types } from "mobx-state-tree";
import { IMapType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType, InstantiateContext, setParent, setType } from "./base";
import { $identifier } from "./symbols";

export class MapType<T extends IAnyType> extends BaseType<
  Record<string, T["InputType"]>,
  Record<string, T["InstanceType"]>,
  IMapType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`map<${childrenType.name}>`, types.map(childrenType.mstType));
  }

  protected instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const map: Record<string, T["InstanceType"]> = {};
    if (snapshot) {
      Object.entries(snapshot).forEach(([key, value]) => {
        const item = this.childrenType.createReadOnly(value);
        setParent(item, map);

        const instanceKey: string = item[$identifier] ?? key;
        map[instanceKey] = item;
      });
    }

    setType(map, this);

    return map;
  }
}

export const map = <T extends IAnyType>(childrenType: T): MapType<T> => {
  return new MapType(childrenType);
};

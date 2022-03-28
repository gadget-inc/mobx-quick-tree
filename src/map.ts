import { types } from "mobx-state-tree";
import { IMapType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType, setParent, setType } from "./base";

export class MapType<T extends IAnyType> extends BaseType<
  Record<string, T["InputType"]>,
  Record<string, T["InstanceType"]>,
  IMapType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`map<${childrenType.name}>`, types.map(childrenType.mstType));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const map = {};
    if (snapshot) {
      Object.entries(snapshot).forEach(([key, value]) => {
        const item = this.childrenType.createReadOnly(value);
        setParent(item, map);
        map[key] = item;
      });
    }

    setType(map, this);

    return map;
  }
}

export const map = <T extends IAnyType>(childrenType: T): MapType<T> => {
  return new MapType(childrenType);
};

import { types } from "mobx-state-tree";
import { IMapType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType } from "./base";

export class MapType<T extends IAnyType> extends BaseType<
  Record<string, T["InputType"]>,
  Record<string, T["InstanceType"]>,
  IMapType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`map<${childrenType.name}>`, types.map(childrenType.mstType));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    if (!snapshot) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(snapshot).map(([key, value]) => [key, this.childrenType.createReadOnly(value)])
    );
  }
}

export const map = <T extends IAnyType>(childrenType: T): MapType<T> => {
  return new MapType(childrenType);
};

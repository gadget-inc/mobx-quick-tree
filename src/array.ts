import { types } from "mobx-state-tree";
import { IArrayType } from "mobx-state-tree/dist/internal";
import { BaseType, IAnyType, InstantiateContext, setParent, setType } from "./base";

export class ArrayType<T extends IAnyType> extends BaseType<
  ReadonlyArray<T["InputType"]>,
  ReadonlyArray<T["InstanceType"]>,
  IArrayType<T["mstType"]>
> {
  constructor(readonly childrenType: T) {
    super(`array<${childrenType.name}>`, types.array(childrenType.mstType));
  }

  protected instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    const array: T["InstanceType"][] = [];
    if (snapshot) {
      snapshot.forEach((child) => {
        const item = this.childrenType.createReadOnly(child);
        setParent(item, array);
        array.push(item);
      });
    }

    setType(array, this);

    return array;
  }
}

export const array = <T extends IAnyType>(childrenType: T): ArrayType<T> => {
  return new ArrayType(childrenType);
};

import { ISimpleType as MSTSimpleType, SnapshotIn, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext, ISimpleType, Primitives } from "./types";

export class SimpleType<T> extends BaseType<T, T, T, MSTSimpleType<T>> {
  static for<MSTType extends MSTSimpleType<any>>(mstType: MSTType): ISimpleType<SnapshotIn<MSTType>> {
    return new SimpleType(mstType.name, mstType);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }
    return snapshot as this["InstanceType"];
  }
}

export class DateType extends BaseType<Date | number, number, Date, typeof types.Date> {
  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }

    if (typeof snapshot == "number") {
      snapshot = new Date(snapshot);
    }

    return snapshot as this["InstanceType"];
  }
}

export class LiteralType<T extends Primitives> extends SimpleType<T> {
  constructor(readonly value: T) {
    const mstType = types.literal<T>(value);
    super(mstType.name, mstType);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot !== this.value) {
      throw new Error(`expected literal type to be initialized with ${this.value}`);
    }
    return this.value as this["InstanceType"];
  }
}

export const literal = <T extends Primitives>(value: T): ISimpleType<T> => {
  return new LiteralType(value);
};

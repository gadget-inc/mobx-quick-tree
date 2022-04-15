import { ISimpleType as MSTSimpleType, SnapshotIn, types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext, ISimpleType, Primitives } from "./types";

export class SimpleType<T> extends BaseType<T, T, T> {
  static for<MSTType extends MSTSimpleType<any>>(mstType: MSTType): ISimpleType<SnapshotIn<MSTType>> {
    return new SimpleType(mstType);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }
    return snapshot as this["InstanceType"];
  }
}

export class DateType extends BaseType<Date | number, number, Date> {
  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }

    return new Date(snapshot);
  }
}

class LiteralType<T extends Primitives> extends SimpleType<T> {
  constructor(readonly value: T) {
    super(types.literal<T>(value));
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

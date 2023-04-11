import type { ISimpleType as MSTSimpleType } from "mobx-state-tree";
import { types } from "mobx-state-tree";
import { BaseType } from "./base";
import type { InstantiateContext, ISimpleType } from "./types";

export type Primitives = string | number | boolean | Date | null | undefined;

export class SimpleType<T> extends BaseType<T, T, T> {
  static for<T extends Primitives>(expectedType: string, mstType: MSTSimpleType<T>): ISimpleType<T> {
    return new SimpleType(expectedType, mstType);
  }

  constructor(readonly expectedType: string, mstType: MSTSimpleType<T>) {
    super(mstType);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }
    return snapshot as this["InstanceType"];
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return typeof value == this.expectedType;
  }
}

export class DateType extends BaseType<Date | number, number, Date> {
  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot === undefined) {
      throw new Error(`can't initialize simple type ${this.name} with undefined`);
    }

    return new Date(snapshot);
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return typeof value == "number" || value instanceof Date;
  }
}

export class IntegerType extends BaseType<number, number, number> {
  constructor() {
    super(types.integer);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (!Number.isInteger(snapshot)) {
      throw new Error(`can't initialize integer with ${snapshot}`);
    }

    return snapshot as this["InstanceType"];
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return Number.isInteger(value);
  }
}

export class NullType extends BaseType<null, null, null> {
  constructor() {
    super(types.null);
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot !== null) {
      throw new Error(`can't initialize null with ${snapshot}`);
    }

    return null;
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return value === null;
  }
}

export class LiteralType<T extends Primitives> extends SimpleType<T> {
  constructor(readonly value: T) {
    super(typeof value, types.literal<T>(value));
  }

  instantiate(snapshot: this["InputType"] | undefined, _context: InstantiateContext): this["InstanceType"] {
    if (snapshot !== this.value) {
      throw new Error(`expected literal type to be initialized with ${this.value}`);
    }
    return this.value as this["InstanceType"];
  }

  is(value: any): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    return value === this.value;
  }
}

export const literal = <T extends Primitives>(value: T): ISimpleType<T> => {
  return new LiteralType(value);
};

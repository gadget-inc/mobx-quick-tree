import type { IAnyType, Instance, SnapshotIn } from "../src";

/** Easily reate an observable or readonly instance of a type */
export const create = <T extends IAnyType>(type: T, snapshot?: SnapshotIn<T>, readOnly = false): Instance<T> => {
  if (readOnly) {
    return type.createReadOnly(snapshot);
  } else {
    return type.create(snapshot);
  }
};

export type Constructor<T = {}> = new (...args: any[]) => T;

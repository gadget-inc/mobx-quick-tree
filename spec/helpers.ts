import type { IAnyType, Instance, SnapshotIn } from "../src";

/** Easily create an observable or readonly instance of a type */
export const create = <T extends IAnyType>(type: T, snapshot?: SnapshotIn<T>, readOnly = false): Instance<T> => {
  if (readOnly) {
    return type.createReadOnly(snapshot);
  } else {
    return type.create(snapshot);
  }
};

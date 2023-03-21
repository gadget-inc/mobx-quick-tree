import type { SnapshotIn } from "../../src";
import { ClassModel, getSnapshot, register, types } from "../../src";

@register
export class Child extends ClassModel({
  name: types.string,
}) {}

export const ChildSnapshot: SnapshotIn<typeof Child> = { name: "hello" };

// export const DefaultNominalServerContract = ServerContract;
export const DefaultedChild = types.optional(Child, ChildSnapshot);

@register
export class Parent extends ClassModel({
  child: DefaultedChild,
}) {}

export const parent = Parent.create();

const _snapshot = getSnapshot(parent);
const _childSnapshot = getSnapshot(parent.child);
type t = typeof parent.child;

const createdChild = DefaultedChild.create();
const _createdChildSnapshot = getSnapshot(createdChild);

import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { SnapshotOut } from "../src";
import { types } from "../src";
import { getSnapshot } from "../src/api";
import { TestClassModel } from "./fixtures/TestClassModel";
import { NamedThing, TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("getSnapshot", () => {
  test("returns the expected snapshot for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for an observable class model instance", () => {
    const m = TestClassModel.create(TestModelSnapshot);
    const snapshot = getSnapshot(m);
    assert<IsExact<typeof snapshot.bool, boolean>>(true);
    expect(snapshot).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for a read only class model instance", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot);
    const snapshot = getSnapshot(m);
    assert<IsExact<typeof snapshot.bool, boolean>>(true);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns a plain object for QuickMap", () => {
    const now = new Date();
    const m = types.map(types.frozen()).createReadOnly({ A: now, B: "test" });
    expect(getSnapshot(m)).toEqual({ A: now.getTime(), B: "test" });
  });

  test("returns a number for types.Date", () => {
    const now = new Date();
    const m = types.Date.createReadOnly(now);
    expect(getSnapshot(m)).toEqual(now.getTime());
  });

  test("returns undefined for a maybeNull(frozen)", () => {
    const m = types.maybeNull(types.frozen()).createReadOnly();
    expect(getSnapshot(m)).toEqual(undefined);
  });

  test("returns a string for reference types", () => {
    const m = types.model({
      testModels: types.array(TestModel),
      ref: types.reference(NamedThing),
      safeRef1: types.safeReference(NamedThing),
      safeRef2: types.safeReference(NamedThing),
    });

    const instance = m.createReadOnly({
      testModels: [
        { bool: true, nested: { key: "a", name: "a 1" }, frozen: { test: "string" } },
        { bool: false, nested: { key: "b", name: "b 2" }, frozen: { test: "string" } },
      ],
      ref: "b",
      safeRef1: "x",
      safeRef2: "a",
    });

    expect(instance.ref.name).toEqual("b 2");
    expect(getSnapshot(instance).ref).toEqual("b");
    expect(getSnapshot(instance).safeRef1).toBeUndefined();
    expect(getSnapshot(instance).safeRef2).toEqual("a");
  });

  function verifySnapshot(snapshot: any) {
    expect(snapshot).toEqual(expect.objectContaining(TestModelSnapshot));
    expect(snapshot.map.test_key.key).toEqual("test_key");
  }

  test("snapshots an observable node model instance", () => {
    const instance = TestModel.create(TestModelSnapshot);
    const snapshot = getSnapshot(instance);
    verifySnapshot(snapshot);
    assert<IsExact<typeof snapshot.map.test_key, SnapshotOut<typeof NamedThing>>>(true);
  });

  test("snapshots an readonly node model instance", () => {
    const instance = TestModel.createReadOnly(TestModelSnapshot);
    const snapshot = getSnapshot(instance);
    verifySnapshot(snapshot);
    assert<IsExact<typeof snapshot.map.test_key, SnapshotOut<typeof NamedThing>>>(true);
  });

  test("snapshots an observable class model instance", () => {
    const instance = TestClassModel.create(TestModelSnapshot);
    const snapshot = getSnapshot(instance);
    verifySnapshot(snapshot);
    assert<IsExact<typeof snapshot.map.test_key, SnapshotOut<typeof NamedThing>>>(true);
  });

  test("snapshots an readonly class model instance", () => {
    const instance = TestClassModel.createReadOnly(TestModelSnapshot);
    const snapshot = getSnapshot(instance);
    verifySnapshot(snapshot);
    assert<IsExact<typeof snapshot.map.test_key, SnapshotOut<typeof NamedThing>>>(true);
  });
});

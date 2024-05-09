import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { IReferenceType, SnapshotOut } from "../src";
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

  test("snapshots a reference type correctly in a map / array", () => {
    const RootType = types.model({
      things: types.map(NamedThing),
      refMap: types.map(types.reference(NamedThing)),
      refArray: types.array(types.reference(NamedThing)),
    });

    const instance = RootType.createReadOnly({
      things: {
        a: { key: "a", name: "test a" },
        b: { key: "b", name: "test b" },
      },
      refMap: { a: "a", b: "b" },
      refArray: ["a", "b"],
    });

    const snapshot = getSnapshot(instance);
    assert<IsExact<typeof snapshot.things.test_key, SnapshotOut<typeof NamedThing>>>(true);
    assert<IsExact<typeof snapshot.refMap.test_key, SnapshotOut<IReferenceType<typeof NamedThing>>>>(true);
    expect(snapshot.refMap.a).toEqual("a");
    expect(snapshot.refMap.b).toEqual("b");
    expect(snapshot.refArray[0]).toEqual("a");
    expect(snapshot.refArray[1]).toEqual("b");

    const reconstructedInstance = RootType.createReadOnly(snapshot);
    expect(reconstructedInstance.refMap.get("a")?.name).toEqual("test a");
    expect(reconstructedInstance.refMap.get("b")?.name).toEqual("test b");
    expect(reconstructedInstance.refArray[0]?.name).toEqual("test a");
    expect(reconstructedInstance.refArray[1]?.name).toEqual("test b");
  });
});

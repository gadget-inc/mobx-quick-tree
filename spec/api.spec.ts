import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { SnapshotOut } from "../src";
import { types } from "../src";
import {
  applySnapshot,
  getEnv,
  getParent,
  getParentOfType,
  getRoot,
  getSnapshot,
  isArrayType,
  isMapType,
  isModelType,
  isRoot,
} from "../src/api";
import { TestClassModel } from "./fixtures/TestClassModel";
import { NamedThing, TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("getParent", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(() => getParent(m)).toThrow();
    expect(getParent(m.nested)).toEqual(m);
  });

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(() => getParent(m)).toThrow();
    expect(getParent(m.nested)).toEqual(m);
  });

  test("returns the root for a class model instance", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot);
    expect(() => getParent(m)).toThrow();
    expect(getParent(m.nested)).toEqual(m);
  });
});

describe("getParentOfType", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    const parent = getParentOfType(m.nested, TestModel);
    expect(parent).toEqual(m);
    expect(parent.optional).toEqual("value");
    expect(parent.setB).toBeTruthy();
  });

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    expect(getParentOfType(m.nested, TestModel)).toEqual(m);
  });

  test("returns the proper root for class model instance", () => {
    const m = new TestClassModel(TestModelSnapshot);
    expect(() => getParentOfType(m, TestClassModel)).toThrow();
    const parent = getParentOfType(m.nested, TestClassModel);
    expect(parent).toEqual(m);
    expect(parent.optional).toEqual("value");
    expect(parent.setB).toBeTruthy();
    assert<IsExact<typeof parent, TestClassModel>>(true);
  });
});

describe("getRoot", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(getRoot(m)).toEqual(m);
    expect(getRoot(m.nested)).toEqual(m);
  });

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(getRoot(m)).toEqual(m);
    expect(getRoot(m.nested)).toEqual(m);
  });

  test("returns the proper root with an array and map in the middle", () => {
    const model = types.model("Test", {
      others: types.map(types.model("Another", { tests: types.array(TestModel) })),
    });

    const instance = model.createReadOnly({ others: { key: { tests: [TestModelSnapshot] } } });
    const others = Array.from(instance.others.values());
    expect(getRoot(others[0].tests[0])).toEqual(instance);
  });
});

describe("getSnapshot", () => {
  test("returns the expected snapshot for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for an observable class model instance", () => {
    const m = new TestClassModel(TestModelSnapshot);
    const snapshot = getSnapshot(m);
    assert<IsExact<typeof snapshot.bool, boolean>>(true);
    expect(snapshot).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for a read only class model instance", () => {
    const m = new TestClassModel(TestModelSnapshot, undefined, true);
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

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });
});

describe("getEnv", () => {
  test("returns expected env for quick tree instances", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
  });

  test("returns expected env for MST instances", () => {
    const m = TestModel.create(TestModelSnapshot, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
  });

  test("returns expected env for read only model class instances", () => {
    const m = new TestClassModel(TestModelSnapshot, { test: 1 }, true);
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
  });
});

describe("isRoot", () => {
  test("returns true for root quick tree instances", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });

  test("returns true for root MST instances", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });

  test("returns true for root read only class model instances", () => {
    const m = new TestClassModel(TestModelSnapshot, undefined, true);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });
});

describe("isArrayType", () => {
  test("returns true for array types", () => {
    expect(isArrayType(types.array(TestModel))).toEqual(true);
    expect(isArrayType(types.map(TestModel))).toEqual(false);
    expect(isArrayType(TestModel)).toEqual(false);
    expect(isArrayType(types.string)).toEqual(false);
  });
});

describe("isMapType", () => {
  test("returns true for map types", () => {
    expect(isMapType(types.map(TestModel))).toEqual(true);
    expect(isMapType(types.array(TestModel))).toEqual(false);
    expect(isMapType(TestModel)).toEqual(false);
    expect(isMapType(types.string)).toEqual(false);
  });
});

describe("isModelType", () => {
  test("returns true for model types", () => {
    expect(isModelType(TestModel)).toEqual(true);
    expect(isModelType(types.map(TestModel))).toEqual(false);
    expect(isModelType(types.array(TestModel))).toEqual(false);
    expect(isModelType(types.string)).toEqual(false);
  });
});

describe("applySnapshot", () => {
  test("applies successfully to an MST node", () => {
    const m = TestModel.create(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(m),
      optional: "a different value",
    };

    applySnapshot(m, snap);

    expect(m).toEqual(
      expect.objectContaining({
        optional: "a different value",
      })
    );
  });

  test("throws for an MQT node", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(m),
      optional: "a different value",
    };

    expect(() => applySnapshot(m, snap)).toThrow();
  });

  test("throws for class model node", () => {
    const m = new TestClassModel(TestModelSnapshot, undefined, true);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(m),
      optional: "a different value",
    };

    expect(() => applySnapshot(m, snap)).toThrow();
  });
});

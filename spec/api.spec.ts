import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { SnapshotOut } from "../src";
import { create, isReadOnlyNode, isStateTreeNode, types } from "../src";
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

describe("create", () => {
  test("creates an observable instance if not passed the read-only flag", () => {
    const i = create(TestModel, TestModelSnapshot);
    expect(isStateTreeNode(i)).toBe(true);
    expect(isReadOnlyNode(i)).toBe(false);
  });

  test("creates a read-only instance if passed the read-only flag", () => {
    const i = create(TestModel, TestModelSnapshot, true);
    expect(isStateTreeNode(i)).toBe(true);
    expect(isReadOnlyNode(i)).toBe(true);
  });

  test("creates an observable instance of a class model if not passed the read-only flag", () => {
    const i = create(TestClassModel, TestModelSnapshot);
    expect(isStateTreeNode(i)).toBe(true);
    expect(isReadOnlyNode(i)).toBe(false);
  });

  test("creates a read-only instance of a class model if passed the read-only flag", () => {
    const i = create(TestClassModel, TestModelSnapshot, true);
    expect(isStateTreeNode(i)).toBe(true);
    expect(isReadOnlyNode(i)).toBe(true);
  });
});

describe("getParent", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = create(TestModel, TestModelSnapshot, true);
    expect(() => getParent(m)).toThrow();
    expect(getParent(m.nested)).toEqual(m);
  });

  test("returns the proper root for an MST instance", () => {
    const m = create(TestModel, TestModelSnapshot);
    expect(() => getParent(m)).toThrow();
    expect(getParent(m.nested)).toEqual(m);
  });
});

describe("getParentOfType", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = create(TestModel, TestModelSnapshot, true);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    const parent = getParentOfType(m.nested, TestModel);
    expect(parent).toEqual(m);
    expect(parent.optional).toEqual("value");
    expect(parent.setB).toBeTruthy();
  });

  test("returns the proper root for an MST instance", () => {
    const m = create(TestModel, TestModelSnapshot);
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
    const m = create(TestModel, TestModelSnapshot, true);
    expect(getRoot(m)).toEqual(m);
    expect(getRoot(m.nested)).toEqual(m);
  });

  test("returns the proper root for an MST instance", () => {
    const m = create(TestModel, TestModelSnapshot);
    expect(getRoot(m)).toEqual(m);
    expect(getRoot(m.nested)).toEqual(m);
  });

  test("returns the proper root with an array and map in the middle", () => {
    const model = types.model("Test", {
      others: types.map(types.model("Another", { tests: types.array(TestModel) })),
    });

    const instance = create(model, { others: { key: { tests: [TestModelSnapshot] } } }, true);
    const others = Array.from(instance.others.values());
    expect(getRoot(others[0].tests[0])).toEqual(instance);
  });
});

describe("getSnapshot", () => {
  test("returns the expected snapshot for a read-only instance", () => {
    const m = create(TestModel, TestModelSnapshot, true);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for an observable class model instance", () => {
    const m = new TestClassModel(TestModelSnapshot);
    const snapshot = getSnapshot(m);
    assert<IsExact<typeof snapshot.bool, boolean>>(true);
    expect(snapshot).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns the expected snapshot for a read only class model instance", () => {
    const m = new TestClassModel(TestModelSnapshot, undefined);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });

  test("returns a plain object for QuickMap", () => {
    const now = new Date();
    const m = create(types.map(types.frozen()), { A: now, B: "test" }, true);
    expect(getSnapshot(m)).toEqual({ A: now.getTime(), B: "test" });
  });

  test("returns a number for types.Date", () => {
    const now = new Date();
    const m = create(types.Date, now, true);
    expect(getSnapshot(m)).toEqual(now.getTime());
  });

  test("returns undefined for a maybeNull(frozen)", () => {
    const m = create(types.maybeNull(types.frozen()), undefined, true);
    expect(getSnapshot(m)).toEqual(undefined);
  });

  test("returns a string for reference types", () => {
    const m = types.model({
      testModels: types.array(TestModel),
      ref: types.reference(NamedThing),
      safeRef1: types.safeReference(NamedThing),
      safeRef2: types.safeReference(NamedThing),
    });

    const instance = create(
      m,
      {
        testModels: [
          { bool: true, nested: { key: "a", name: "a 1" }, frozen: { test: "string" } },
          { bool: false, nested: { key: "b", name: "b 2" }, frozen: { test: "string" } },
        ],
        ref: "b",
        safeRef1: "x",
        safeRef2: "a",
      },
      true
    );

    expect(instance.ref.name).toEqual("b 2");
    expect(getSnapshot(instance).ref).toEqual("b");
    expect(getSnapshot(instance).safeRef1).toBeUndefined();
    expect(getSnapshot(instance).safeRef2).toEqual("a");
  });

  test("returns the proper root for an MST instance", () => {
    const m = create(TestModel, TestModelSnapshot);
    expect(getSnapshot(m)).toEqual(expect.objectContaining(TestModelSnapshot));
  });
});

describe("getEnv", () => {
  test("returns expected env for quick tree instances", () => {
    const m = create(TestModel, TestModelSnapshot, true, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
  });

  test("returns expected env for MST instances", () => {
    const m = create(TestModel, TestModelSnapshot, undefined, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
  });

  test("returns expected env for read only model class instances", () => {
    const m = create(TestClassModel, TestModelSnapshot, undefined, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
    expect(getEnv(m.array[0])).toEqual({ test: 1 });
  });
});

describe("isRoot", () => {
  test("returns true for root quick tree instances", () => {
    const m = create(TestModel, TestModelSnapshot, true);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });

  test("returns true for root MST instances", () => {
    const m = create(TestModel, TestModelSnapshot);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });

  test("returns true for root read only class model instances", () => {
    const m = new TestClassModel(TestModelSnapshot);
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
    const m = create(TestModel, TestModelSnapshot);
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
    const m = create(TestModel, TestModelSnapshot, true);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(m),
      optional: "a different value",
    };

    expect(() => applySnapshot(m, snap)).toThrow();
  });

  test("throws for class model node", () => {
    const m = new TestClassModel(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(m),
      optional: "a different value",
    };

    expect(() => applySnapshot(m, snap)).toThrow();
  });
});

describe("isReadOnlyNode", () => {
  test("reports on model instance", () => {
    expect(isReadOnlyNode(create(TestModel, TestModelSnapshot))).toEqual(false);
    expect(isReadOnlyNode(create(TestModel, TestModelSnapshot, true))).toEqual(true);
  });

  test("reports on class model instance", () => {
    expect(isReadOnlyNode(create(TestClassModel, TestModelSnapshot))).toEqual(false);
    expect(isReadOnlyNode(create(TestClassModel, TestModelSnapshot, true))).toEqual(true);
  });

  test("reports on array instance", () => {
    expect(isReadOnlyNode(create(types.array(types.number), [1, 2, 3]))).toEqual(false);
    expect(isReadOnlyNode(create(types.array(types.number), [1, 2, 3], true))).toEqual(true);
  });

  test("reports on map instance", () => {
    expect(isReadOnlyNode(create(types.map(types.string), { foo: "bar" }))).toEqual(false);
    expect(isReadOnlyNode(create(types.map(types.string), { foo: "bar" }, true))).toEqual(true);
  });
});

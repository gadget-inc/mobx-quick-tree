import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { SnapshotOut } from "../src";
import { hasEnv, isReadOnlyNode, resolveIdentifier, types } from "../src";
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
import { NamedThingClass, TestClassModel } from "./fixtures/TestClassModel";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

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
});

describe("getParentOfType", () => {
  test("returns the proper root for a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    expect(getParentOfType(m.nested, TestModel)).toEqual(m);
    expect(getParentOfType(m.nested, TestModel).optional).toEqual("value");
  });

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    expect(getParentOfType(m.nested, TestModel)).toEqual(m);
  });

  test("returns the proper root for class model instance", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot);
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

describe("hasEnv", () => {
  describe.each(["with", "without"])("%s an env", (withOrWithoutYou) => {
    const expected = withOrWithoutYou == "with" ? true : false;
    const env = withOrWithoutYou == "with" ? { test: 1 } : undefined;

    test(`returns ${expected} for quick tree instances`, () => {
      const m = TestModel.createReadOnly(TestModelSnapshot, env);
      expect(hasEnv(m)).toEqual(expected);
    });

    test(`returns ${expected} for MST instances with an env`, () => {
      const m = TestModel.create(TestModelSnapshot, env);
      expect(hasEnv(m)).toEqual(expected);
    });

    test(`returns ${expected} for read only model class instances`, () => {
      const m = TestClassModel.createReadOnly(TestModelSnapshot, env);
      expect(hasEnv(m)).toEqual(expected);
    });
  });
});

describe("getEnv", () => {
  test("throws for quick tree instances without envs", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
  });

  test("throws for MST instances without envs", () => {
    const m = TestModel.create(TestModelSnapshot, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
  });

  test("throws for read only model class instances without envs", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot);
    expect(() => getEnv(m)).toThrow();
  });

  test("returns expected env for quick tree instances", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(() => getEnv(m)).toThrow();
  });

  test("returns expected env for MST instances", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(() => getEnv(m)).toThrow();
  });

  test("returns expected env for read only model class instances", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot, { test: 1 });
    expect(getEnv(m)).toEqual({ test: 1 });
    expect(getEnv(m.map.get("test_key")!)).toEqual({ test: 1 });
    expect(getEnv(m.array[0])).toEqual({ test: 1 });
  });
});

describe("isRoot", () => {
  test("returns true for root instances", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(isRoot(m)).toEqual(true);
    expect(isRoot(m.nested)).toEqual(false);
  });

  test("returns true for root read only class model instances", () => {
    const m = TestClassModel.createReadOnly(TestModelSnapshot);
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
  test("applies successfully to an observable MST node", () => {
    const instance = TestModel.create(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(instance),
      optional: "a different value",
    };

    applySnapshot(instance, snap);

    expect(instance).toEqual(
      expect.objectContaining({
        optional: "a different value",
      }),
    );
  });

  test("applies successfully to an observable class model node", () => {
    const instance = TestClassModel.create(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestClassModel> = {
      ...getSnapshot(instance),
      optional: "a different value",
    };

    applySnapshot(instance, snap);

    expect(instance).toEqual(
      expect.objectContaining({
        optional: "a different value",
      }),
    );
  });

  test("throws for a readonly MQT node", () => {
    const instance = TestModel.createReadOnly(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestModel> = {
      ...getSnapshot(instance),
      optional: "a different value",
    };

    expect(() => applySnapshot(instance, snap)).toThrow();
  });

  test("throws for readonly class model node", () => {
    const instance = TestClassModel.createReadOnly(TestModelSnapshot);
    const snap: SnapshotOut<typeof TestClassModel> = {
      ...getSnapshot(instance),
      optional: "a different value",
    };

    expect(() => applySnapshot(instance, snap)).toThrow();
  });
});

describe("isReadOnlyNode", () => {
  test("reports on model instance", () => {
    expect(isReadOnlyNode(TestModel.create(TestModelSnapshot))).toEqual(false);
    expect(isReadOnlyNode(TestModel.createReadOnly(TestModelSnapshot))).toEqual(true);
  });

  test("reports on class model instance", () => {
    expect(isReadOnlyNode(TestClassModel.create(TestModelSnapshot))).toEqual(false);
    expect(isReadOnlyNode(TestClassModel.createReadOnly(TestModelSnapshot))).toEqual(true);
  });

  test("reports on array instance", () => {
    expect(isReadOnlyNode(types.array(types.number).create([1, 2, 3]))).toEqual(false);
    expect(isReadOnlyNode(types.array(types.number).createReadOnly([1, 2, 3]))).toEqual(true);
  });

  test("reports on map instance", () => {
    expect(isReadOnlyNode(types.map(types.string).create({ foo: "bar" }))).toEqual(false);
    expect(isReadOnlyNode(types.map(types.string).createReadOnly({ foo: "bar" }))).toEqual(true);
  });
});

describe("resolveIdentifier", () => {
  describe.each([
    ["readonly", true],
    ["mutable", false],
  ])("on %s nodes", (_name, readonly) => {
    let instance: TestClassModel;
    beforeEach(() => {
      instance = readonly ? TestClassModel.createReadOnly(TestModelSnapshot) : TestClassModel.create(TestModelSnapshot);
    });

    test("resolves an identifier from the root of the tree", () => {
      expect(resolveIdentifier(NamedThingClass, instance, "mixed_up")).toBe(instance.nested);

      expect(resolveIdentifier(NamedThingClass, instance, "mixed_up")?.key).toEqual("mixed_up");
      expect(resolveIdentifier(NamedThingClass, instance, "test_key")?.key).toEqual("test_key");
    });

    test("resolves an identifier from within the tree", () => {
      expect(resolveIdentifier(NamedThingClass, instance.array[0], "mixed_up")?.key).toEqual("mixed_up");
      expect(resolveIdentifier(NamedThingClass, instance.map.get("test_key")!, "test_key")?.key).toEqual("test_key");
    });

    test("returns undefined when the identifier doesn't resolve", () => {
      expect(resolveIdentifier(NamedThingClass, instance, "not-gonna-be-found")).toBeUndefined();
    });
  });
});

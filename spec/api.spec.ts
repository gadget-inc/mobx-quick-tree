import { types } from "../src";
import { getParent, getParentOfType, getRoot, isArrayType, isMapType, isModelType, isRoot } from "../src/api";
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
  });

  test("returns the proper root for an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(() => getParentOfType(m, TestModel)).toThrow();
    expect(getParentOfType(m.nested, TestModel)).toEqual(m);
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
    expect(getRoot(Array.from(instance.others.values())[0].tests[0])).toEqual(instance);
  });
});

describe("isRoot", () => {
  test("returns true for root instances", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
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

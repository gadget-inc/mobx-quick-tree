import { isStateTreeNode } from "mobx-state-tree";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("can create", () => {
  test("a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(m.bool).toEqual(true);
    expect(m.notBool).toEqual(false);
    expect(m.frozen.test).toEqual("string");
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(isStateTreeNode(m)).toEqual(false);
  });

  test("an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    expect(m.bool).toEqual(true);
    expect(m.notBool).toEqual(false);
    expect(m.frozen.test).toEqual("string");
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(isStateTreeNode(m)).toEqual(true);
  });
});

describe("is", () => {
  test("can verify a read-only instance", () => {
    const value = TestModel.createReadOnly(TestModelSnapshot);
    expect(TestModel.is(value)).toEqual(true);
    expect(TestModel.is(TestModelSnapshot)).toEqual(true);
    expect(TestModel.is(true)).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
  });

  test("can verify an MST instance", () => {
    const value = TestModel.create(TestModelSnapshot);
    expect(TestModel.is(value)).toEqual(TestModel.mstType.is(value));
    expect(TestModel.is(TestModelSnapshot)).toEqual(TestModel.mstType.is(TestModelSnapshot));
    expect(TestModel.is(true)).toEqual(TestModel.mstType.is(true));
    expect(TestModel.is({})).toEqual(TestModel.mstType.is({}));
    expect(TestModel.is({})).toEqual(TestModel.mstType.is({}));
  });
});

describe("actions", () => {
  test("throw on a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(() => m.setB(false)).toThrow();
    expect(m.bool).toEqual(true);
  });

  test("succeed on an MST instance", () => {
    const m = TestModel.create(TestModelSnapshot);
    m.setB(false);
    expect(m.bool).toEqual(false);
  });
});

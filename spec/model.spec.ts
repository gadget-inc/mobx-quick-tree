import { isStateTreeNode } from "mobx-state-tree";
import { types } from "../src";
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
  test.skip("can verify a read-only instance", () => {
    // TODO currently we have MST do all of the heavy lifting for our `is` checks, but it doesn't like our map instances. Skipping this test
    //   until we implement our own version of `is`.
    const value = TestModel.createReadOnly(TestModelSnapshot);
    expect(TestModel.is(value)).toEqual(true);
    expect(TestModel.is(TestModelSnapshot)).toEqual(true);
    expect(TestModel.is(true)).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
  });

  test("can verify an MST instance", () => {
    const value = TestModel.create(TestModelSnapshot);
    console.info(Object.getPrototypeOf(value.map));
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

test("can compose models", () => {
  const modelAType = types.model("A", { a: types.string }).views((self) => ({
    lenA() {
      return self.a.length;
    },
  }));

  const modelBType = types.model("B", { b: types.optional(types.number, 10) });
  const composedType = types.compose("C", modelAType, modelBType);

  expect(composedType.name).toEqual("C");

  let instance = composedType.createReadOnly({ a: "xyz" });
  expect(instance.a).toEqual("xyz");
  expect(instance.b).toEqual(10);

  instance = composedType.createReadOnly({ a: "abc", b: 4 });
  expect(instance.a).toEqual("abc");
  expect(instance.b).toEqual(4);
});

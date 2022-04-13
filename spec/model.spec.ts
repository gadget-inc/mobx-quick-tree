import { isStateTreeNode } from "mobx-state-tree";
import { types } from "../src";
import { $identifier } from "../src/symbols";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("can create", () => {
  test("a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    expect(m.bool).toEqual(true);
    expect(m.notBool).toEqual(false);
    expect(m.optional).toEqual("value");
    expect(m.frozen.test).toEqual("string");
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(isStateTreeNode(m)).toEqual(false);
  });

  test("a read-only instance with new props", () => {
    const m = TestModel.props({ newThing: types.literal("COOL") }).createReadOnly({
      ...TestModelSnapshot,
      newThing: "COOL",
    });

    expect(m.bool).toEqual(true);
    expect(m.notBool).toEqual(false);
    expect(m.optional).toEqual("value");
    expect(m.frozen.test).toEqual("string");
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(m.newThing).toEqual("COOL");
    expect(isStateTreeNode(m)).toEqual(false);
  });

  test("a read-only instance with an optional identifier", () => {
    const model = types.model("Test", { key: types.optional(types.identifier, () => "test") });
    const m = model.createReadOnly(TestModelSnapshot);
    expect((m as any)[$identifier]).toEqual("test");
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

describe("named", () => {
  test("can rename a model", () => {
    let model = TestModel;
    expect(model.name).toEqual("TestModel");

    model = model.named("AnotherModel");
    expect(model.name).toEqual("AnotherModel");
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
  test("succeed on a read-only instance", () => {
    const m = TestModel.createReadOnly(TestModelSnapshot);
    m.setB(false);
    expect(m.bool).toEqual(false);
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

  const modelBType = types
    .model("B", { b: types.optional(types.number, 10) })
    .views((self) => ({
      get doubleLength() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return (self as any).a.length * 2;
      },
    }))
    .views((self) => ({
      get bSquared() {
        return self.b * self.b;
      },
    }));

  const composedType = types.compose("C", modelAType, modelBType);

  expect(composedType.name).toEqual("C");

  let instance = composedType.createReadOnly({ a: "xyz" });
  expect(instance.a).toEqual("xyz");
  expect(instance.b).toEqual(10);
  expect(instance.lenA()).toEqual(3);
  expect(instance.doubleLength).toEqual(6);
  expect(instance.bSquared).toEqual(100);

  instance = composedType.createReadOnly({ a: "abcde", b: 4 });
  expect(instance.a).toEqual("abcde");
  expect(instance.b).toEqual(4);
  expect(instance.lenA()).toEqual(5);
  expect(instance.doubleLength).toEqual(10);
  expect(instance.bSquared).toEqual(16);
});

test("can compose a model without properties", () => {
  const modelAType = types.model().views(() => ({
    random() {
      return Math.random();
    },
  }));

  const modelBType = types.model("B", { b: types.optional(types.number, 10) }).views((self) => ({
    get bSquared() {
      return self.b * self.b;
    },
  }));

  const composedType = types.compose("C", modelAType, modelBType);

  expect(composedType.name).toEqual("C");

  const instance = composedType.createReadOnly({ b: 10 });
  expect(typeof instance.random()).toEqual("number");
  expect(instance.bSquared).toEqual(100);
});

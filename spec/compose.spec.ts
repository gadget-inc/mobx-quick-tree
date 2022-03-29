import { isStateTreeNode } from "mobx-state-tree";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

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

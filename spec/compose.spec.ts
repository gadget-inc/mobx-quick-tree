import { types } from "../src";

test("a read-only instance", () => {
  const TestModel = types.compose("MyType", types.model({ test: "value" }), types.model({ strings: types.array(types.string) }));
  const m = TestModel.createReadOnly({ strings: ["a", "b", "c"] });
  expect(m.test).toEqual("value");
  expect(m.strings).toEqual(["a", "b", "c"]);
});

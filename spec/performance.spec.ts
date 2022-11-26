import { TestClassModel } from "./fixtures/TestClassModel";
import { TestModel } from "./fixtures/TestModel";

describe("performance", () => {
  const N = 10_000;
  const TestModelSnapshot: typeof TestModel["InputType"] = {
    bool: true,
    frozen: { test: "string" },
    nested: {
      key: "mixed_up",
      name: "MiXeD CaSe",
    },
    array: [
      { key: "1", name: "Array Item 1" },
      { key: "b", name: "Array Item 2" },
    ],
    map: {
      a: { key: "a", name: "Map Item A" },
      b: { key: "b", name: "Map Item B" },
    },
  };

  test(`can create ${N} quick instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.createReadOnly(TestModelSnapshot);
    }
  });

  test(`can create ${N} class model instances`, () => {
    for (let x = 0; x < N; ++x) {
      new TestClassModel(TestModelSnapshot, undefined, true);
    }
  });

  test(`can create ${N} MST instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.create(TestModelSnapshot);
    }
  });
});

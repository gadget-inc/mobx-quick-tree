import { TestModel } from "./fixtures/TestModel";

describe("performance", () => {
  const N = 10_000;
  const TestModelSnapshot: typeof TestModel["InputType"] = {
    bool: true,
    frozen: { test: "string" },
    nested: { name: "MiXeD CaSe" },
    array: [{ name: "Array Item 1" }, { name: "Array Item 2" }],
    map: {
      a: { name: "Map Item A" },
      b: { name: "Map Item B" },
    },
  };

  test(`can create ${N} quick instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.createReadOnly(TestModelSnapshot);
    }
  });

  test(`can create ${N} MST instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.create(TestModelSnapshot);
    }
  });
});

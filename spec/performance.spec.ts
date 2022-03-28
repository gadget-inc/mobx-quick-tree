import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("performance", () => {
  const N = 10_000;

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

import { isStateTreeNode } from "mobx-state-tree";
import { types } from "../src";

const TestModel = types.model("TestModel", { b: types.boolean }).views((self) => ({
  get notB() {
    return !self.b;
  },
}));
// .actions((self) => ({
//   setB(v: boolean) {
//     self.b = v;
//   },
// }));

describe("can create", () => {
  test("a quick instance", () => {
    const m = TestModel.createReadOnly({ b: true });
    expect(m.b).toEqual(true);
    expect(m.notB).toEqual(false);
    expect(isStateTreeNode(m)).toEqual(false);
  });

  test("an MST instance", () => {
    const m = TestModel.create({ b: true });
    expect(m.b).toEqual(true);
    expect(m.notB).toEqual(false);
    expect(isStateTreeNode(m)).toEqual(true);
  });
});

describe("performance", () => {
  const N = 50_000;

  test(`can create ${N} quick instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.createReadOnly({ b: true });
    }
  });

  test(`can create ${N} MST instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.create({ b: true });
    }
  });
});

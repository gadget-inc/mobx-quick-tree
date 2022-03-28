import { types } from "../src";
import { getParent, getRoot } from "../src/api";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("tree API", () => {
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
      expect(getRoot(Object.values(instance.others)[0].tests[0])).toEqual(instance);
    });
  });
});

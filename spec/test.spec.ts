import { isStateTreeNode } from "mobx-state-tree";
import { types } from "../src";
import { getParent, getRoot } from "../src/api";

const NamedThing = types
  .model("BooleanWrapper", {
    name: types.string,
  })
  .views((self) => ({
    lowerCasedName() {
      return self.name.toLowerCase();
    },

    upperCasedName() {
      return self.name.toUpperCase();
    },
  }));

const TestModel = types
  .model("TestModel", {
    b: types.boolean,
    nested: NamedThing,
  })
  .views((self) => ({
    get notB() {
      return !self.b;
    },
  }))
  .actions((self) => ({
    setB(v: boolean) {
      self.b = v;
    },
  }));

const snapshot = { b: true, nested: { name: "MiXeD CaSe" } };

describe("can create", () => {
  test("a read-only instance", () => {
    const m = TestModel.createReadOnly(snapshot);
    expect(m.b).toEqual(true);
    expect(m.notB).toEqual(false);
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(isStateTreeNode(m)).toEqual(false);
  });

  test("an MST instance", () => {
    const m = TestModel.create(snapshot);
    expect(m.b).toEqual(true);
    expect(m.notB).toEqual(false);
    expect(m.nested.name).toEqual("MiXeD CaSe");
    expect(m.nested.lowerCasedName()).toEqual("mixed case");
    expect(m.nested.upperCasedName()).toEqual("MIXED CASE");
    expect(isStateTreeNode(m)).toEqual(true);
  });
});

describe("is", () => {
  test("can verify a simple type", () => {
    expect(types.boolean.is(true)).toEqual(true);
    expect(types.boolean.is(false)).toEqual(true);
    expect(types.boolean.is("")).toEqual(false);
    expect(types.boolean.is({})).toEqual(false);
  });

  test("can verify a read-only instance", () => {
    const value = TestModel.createReadOnly(snapshot);
    expect(TestModel.is(value)).toEqual(true);
    expect(TestModel.is(snapshot)).toEqual(true);
    expect(TestModel.is(true)).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
    expect(TestModel.is({})).toEqual(false);
  });

  test("can verify an MST instance", () => {
    const value = TestModel.create(snapshot);
    expect(TestModel.is(value)).toEqual(TestModel.mstType.is(value));
    expect(TestModel.is(snapshot)).toEqual(TestModel.mstType.is(snapshot));
    expect(TestModel.is(true)).toEqual(TestModel.mstType.is(true));
    expect(TestModel.is({})).toEqual(TestModel.mstType.is({}));
    expect(TestModel.is({})).toEqual(TestModel.mstType.is({}));
  });
});

describe("actions", () => {
  test("throw on a read-only instance", () => {
    const m = TestModel.createReadOnly(snapshot);
    expect(() => m.setB(false)).toThrow();
    expect(m.b).toEqual(true);
  });

  test("succeed on an MST instance", () => {
    const m = TestModel.create(snapshot);
    m.setB(false);
    expect(m.b).toEqual(false);
  });
});

describe("tree API", () => {
  describe("getParent", () => {
    test("returns the proper root for a read-only instance", () => {
      const m = TestModel.createReadOnly(snapshot);
      expect(() => getParent(m)).toThrow();
      expect(getParent(m.nested)).toEqual(m);
    });

    test("returns the proper root for an MST instance", () => {
      const m = TestModel.create(snapshot);
      expect(() => getParent(m)).toThrow();
      expect(getParent(m.nested)).toEqual(m);
    });
  });

  describe("getRoot", () => {
    test("returns the proper root for a read-only instance", () => {
      const m = TestModel.createReadOnly(snapshot);
      expect(getRoot(m)).toEqual(m);
      expect(getRoot(m.nested)).toEqual(m);
    });

    test("returns the proper root for an MST instance", () => {
      const m = TestModel.create(snapshot);
      expect(getRoot(m)).toEqual(m);
      expect(getRoot(m.nested)).toEqual(m);
    });
  });
});

describe("performance", () => {
  const N = 50_000;

  test(`can create ${N} quick instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.createReadOnly(snapshot);
    }
  });

  test(`can create ${N} MST instances`, () => {
    for (let x = 0; x < N; ++x) {
      TestModel.create(snapshot);
    }
  });
});

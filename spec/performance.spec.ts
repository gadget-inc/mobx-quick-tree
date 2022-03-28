import { types } from "../src";

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
    bool: types.boolean,
    frozen: types.frozen<{ test: "string" }>(),
    nested: NamedThing,
  })
  .views((self) => ({
    get notBool() {
      return !self.bool;
    },
  }))
  .actions((self) => ({
    setB(v: boolean) {
      self.bool = v;
    },
  }));

const snapshot: typeof TestModel["InputType"] = {
  bool: true,
  frozen: { test: "string" },
  nested: { name: "MiXeD CaSe" },
};

describe("performance", () => {
  const N = 10_000;

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

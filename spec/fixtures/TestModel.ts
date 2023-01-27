import deepFreeze from "deep-freeze-es6";
import type { SnapshotIn } from "../../src";

import { types } from "../../src";

export const NamedThing = types
  .model("NamedThing", {
    key: types.identifier,
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

export const TestModel = types
  .model("TestModel", {
    bool: types.boolean,
    frozen: types.frozen<{ test: "string" }>(),
    nested: NamedThing,
    array: types.array(NamedThing),
    map: types.map(types.late(() => NamedThing)),
    optional: "value",
  })
  .views((self) => ({
    get notBool() {
      return !self.bool;
    },

    get arrayLength(): number {
      return self.array.length;
    },
  }))
  .actions((self) => ({
    setB(v: boolean) {
      self.bool = v;
    },
  }));

export const TestModelSnapshot: SnapshotIn<typeof TestModel> = deepFreeze({
  bool: true,
  frozen: { test: "string" },
  nested: {
    key: "mixed_up",
    name: "MiXeD CaSe",
  },
  map: {
    test_key: {
      key: "test_key",
      name: "Testy McTest",
    },
  },
  array: [
    {
      key: "other_key",
      name: "A test array element",
    },
  ],
});

export const BigTestModelSnapshot: SnapshotIn<typeof TestModel> = deepFreeze({
  bool: true,
  frozen: { test: "string" },
  nested: {
    key: "mixed_up",
    name: "MiXeD CaSe",
  },
  array: [
    { key: "1", name: "Array Item 1" },
    { key: "2", name: "Array Item 2" },
    { key: "3", name: "Array Item 3" },
    { key: "4", name: "Array Item 4" },
    { key: "5", name: "Array Item 4" },
  ],
  map: {
    a: { key: "a", name: "Map Item A" },
    b: { key: "b", name: "Map Item B" },
    c: { key: "c", name: "Map Item C" },
    d: { key: "e", name: "Map Item E" },
    f: { key: "f", name: "Map Item F" },
  },
});

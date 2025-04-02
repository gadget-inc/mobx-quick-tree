import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { TestModel } from "../spec/fixtures/TestModel";
import { TestPlainModel } from "./reference/plain-class";
import { ObservablePlainModel } from "./reference/mobx";
import { benchmarker } from "./benchmark";

const TestModelSnapshot: (typeof TestModel)["InputType"] = {
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

export default benchmarker(async (suite) => {
  suite
    .add("mobx-state-tree", function () {
      TestModel.create(TestModelSnapshot);
    })
    .add("mobx-quick-tree types.model", function () {
      TestModel.createReadOnly(TestModelSnapshot);
    })
    .add("mobx-state-tree ClassModel", function () {
      TestClassModel.create(TestModelSnapshot);
    })
    .add("mobx-quick-tree ClassModel", function () {
      TestClassModel.createReadOnly(TestModelSnapshot);
    })
    .add("plain mobx", function () {
      new ObservablePlainModel(TestModelSnapshot);
    })
    .add("plain es6", function () {
      new TestPlainModel(TestModelSnapshot);
    });

  return suite;
});

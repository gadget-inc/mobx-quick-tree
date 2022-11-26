import { Suite } from "benchmark";
import { create } from "../../src";
import { TestModel } from "../fixtures/TestModel";

const suite = new Suite("instantiating same object with different paradigms");

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

suite
  .add("mobx-state-tree", function () {
    create(TestModel, TestModelSnapshot, false);
  })
  .add("mobx-quick-tree types.model", function () {
    create(TestModel, TestModelSnapshot, true);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: Suite) {
    console.log("Fastest is " + this.filter("fastest").map("name"));
    console.log("Slowest is " + this.filter("slowest").map("name"));
  })
  .run({ async: true });

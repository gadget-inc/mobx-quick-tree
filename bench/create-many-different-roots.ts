import { Suite } from "benchmark";
import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { NameExample } from "../spec/fixtures/NameExample";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));
const suite = new Suite("instantiating a very large root");

suite
  .add("instantiating a large root", function () {
    LargeRoot.createReadOnly(snapshot);
  })
  .add("instantiating a small root", function () {
    NameExample.createReadOnly({ key: "test", name: "test" });
  })
  .add("instantiating a diverse root", function () {
    TestClassModel.createReadOnly(BigTestModelSnapshot);
  })
  .on("start", function () {
    console.profile();
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: Suite) {
    console.profileEnd();
  })
  .run({ async: true });

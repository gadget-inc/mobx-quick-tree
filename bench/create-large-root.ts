import { Suite } from "benchmark";
import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));
const suite = new Suite("instantiating a very large root");

suite
  .add("instantiating a large root", function () {
    LargeRoot.createReadOnly(snapshot);
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

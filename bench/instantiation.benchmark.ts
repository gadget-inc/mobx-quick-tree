import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { NameExample } from "../spec/fixtures/NameExample";
import { benchmarker } from "./benchmark";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  suite
    .add("instantiating a large root", function () {
      LargeRoot.createReadOnly(snapshot);
    })
    .add("instantiating a small root", function () {
      NameExample.createReadOnly({ key: "test", name: "test" });
    })
    .add("instantiating a diverse root", function () {
      TestClassModel.createReadOnly(BigTestModelSnapshot);
    });

  return suite;
});

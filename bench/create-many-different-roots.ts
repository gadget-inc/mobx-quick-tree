import { Bench } from "tinybench";
import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { NameExample } from "../spec/fixtures/NameExample";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));

void (async () => {
  const suite = new Bench();
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

  await suite.warmup();
  await suite.run();
  console.table(suite.table());
})();

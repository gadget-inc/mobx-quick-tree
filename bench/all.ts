import { Bench } from "tinybench";
import { withCodSpeed } from "@codspeed/tinybench-plugin";
import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot, TestModelSnapshot } from "../spec/fixtures/TestModel";
import { registerPropertyAccess } from "./property-access-model-class";

const root = findRoot(__dirname);
const largeRoot = JSON.parse(fs.readFileSync(root + "/spec/fixtures/large-root-snapshot.json", "utf8"));
const fruitAisle = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

void (async () => {
  let suite = new Bench();
  if (process.env.CI) {
    suite = withCodSpeed(suite);
  }

  suite
    .add("instantiating a small root", function () {
      TestClassModel.createReadOnly(TestModelSnapshot);
    })
    .add("instantiating a large root", function () {
      LargeRoot.createReadOnly(largeRoot);
    })
    .add("instantiating a large union", function () {
      FruitAisle.createReadOnly(fruitAisle);
    })
    .add("instantiating a diverse root", function () {
      TestClassModel.createReadOnly(BigTestModelSnapshot);
    })
    .add("instantiating a small root (mobx-state-tree)", function () {
      TestClassModel.create(TestModelSnapshot);
    })
    .add("instantiating a large root (mobx-state-tree)", function () {
      LargeRoot.create(largeRoot);
    })
    .add("instantiating a large union (mobx-state-tree)", function () {
      FruitAisle.create(fruitAisle);
    })
    .add("instantiating a diverse root (mobx-state-tree)", function () {
      TestClassModel.create(BigTestModelSnapshot);
    });

  suite = registerPropertyAccess(suite);

  await suite.warmup();
  await suite.run();

  console.table(suite.table());
})();

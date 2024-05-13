import { withCodSpeed } from "@codspeed/benchmark.js-plugin";
import { Suite } from "benchmark";
import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot, TestModelSnapshot } from "../spec/fixtures/TestModel";

const root = findRoot(__dirname);
const largeRoot = JSON.parse(fs.readFileSync(root + "/spec/fixtures/large-root-snapshot.json", "utf8"));
const fruitAisle = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));
const suite = withCodSpeed(new Suite("instantiating model classes"));

void suite
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
  .run({
    async: true,
    initCount: 100
  });

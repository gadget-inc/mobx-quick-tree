import { Suite } from "benchmark";
import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));
const suite = new Suite("instantiating model classes");

suite
  .add("instantiating a large union", function () {
    FruitAisle.createReadOnly(fruitBasket);
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

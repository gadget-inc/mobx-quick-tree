import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";
import { benchmarker } from "./benchmark";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  suite.add("instantiating a large union", function () {
    FruitAisle.createReadOnly(fruitBasket);
  });

  return suite
});

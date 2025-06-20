import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";
import { benchmarker } from "./benchmark";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  const instances = Array.from({ length: 1000 }, () => FruitAisle.createReadOnly(fruitBasket));
  
  return suite
    .add("symbol lookup overhead test", function () {
      for (const instance of instances) {
        instance.binCount;
        instance.firstBinType;
        instance.firstBinCount;
      }
    })
    .add("memoization cache hit test", function () {
      const shared = instances[0];
      for (let i = 0; i < 1000; i++) {
        shared.binCount;
        shared.firstBinType;
        shared.firstBinCount;
      }
    });
});

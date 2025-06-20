import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";
import { benchmarker } from "./benchmark";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  const readOnlyInstance = FruitAisle.createReadOnly(fruitBasket);
  const mutableInstance = FruitAisle.create(fruitBasket);
  
  readOnlyInstance.binCount;
  readOnlyInstance.firstBinType;
  readOnlyInstance.firstBinCount;
  
  mutableInstance.binCount;
  mutableInstance.firstBinType;
  mutableInstance.firstBinCount;

  return suite
    .add("pure getter access - read-only instance (memoized)", function () {
      readOnlyInstance.binCount;
      readOnlyInstance.firstBinType;
      readOnlyInstance.firstBinCount;
    })
    .add("pure getter access - mutable instance", function () {
      mutableInstance.binCount;
      mutableInstance.firstBinType;
      mutableInstance.firstBinCount;
    })
    .add("pure getter access - read-only instance (cold)", function () {
      const fresh = FruitAisle.createReadOnly(fruitBasket);
      fresh.binCount;
      fresh.firstBinType;
      fresh.firstBinCount;
    });
});

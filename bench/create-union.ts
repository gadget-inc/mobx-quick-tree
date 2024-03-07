import { Bench } from "tinybench";
import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

void (async () => {
  const suite = new Bench();

  suite.add("instantiating a large union", function () {
    FruitAisle.createReadOnly(fruitBasket);
  });

  await suite.warmup();
  await suite.run();
  console.table(suite.table());
})();

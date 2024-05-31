import { Bench } from "tinybench";
import findRoot from "find-root";
import fs from "fs";
import { FruitAisle } from "../spec/fixtures/FruitAisle";

const root = findRoot(__dirname);
const fruitBasket = JSON.parse(fs.readFileSync(root + "/spec/fixtures/fruit-aisle-snapshot.json", "utf8"));

export const registerPropertyAccess = (suite: Bench) => {
  const shared = FruitAisle.createReadOnly(fruitBasket);

  const touchProperties = (instance: FruitAisle) => {
    instance.binCount;
    instance.null;
    instance.firstBinCount;
    instance.firstBinType;
  };

  let instance: FruitAisle;

  return suite
    .add(
      "accessing unmemoized null property of a class model",
      function () {
        instance.null;
      },
      {
        beforeEach() {
          instance = FruitAisle.createReadOnly(fruitBasket);
        },
      },
    )
    .add("accessing memoized null property of a class model", function () {
      shared.null;
    })
    .add(
      "accessing unmemoized getter properties of a class model",
      function () {
        touchProperties(instance);
      },
      {
        beforeEach() {
          instance = FruitAisle.createReadOnly(fruitBasket);
        },
      },
    )
    .add("accessing memoized getter properties of a class model", function () {
      touchProperties(shared);
    });
};

if (require.main === module) {
  void (async () => {
    const suite = new Bench();
    registerPropertyAccess(suite);
    await suite.warmup();
    await suite.run();
    console.table(suite.table());
  })();
}

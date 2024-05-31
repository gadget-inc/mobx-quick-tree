import { Bench } from "tinybench";
import findRoot from "find-root";
import fs from "fs";
import { LargeRoot } from "../spec/fixtures/LargeRoot";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));
void (async () => {
  const suite = new Bench();

  suite.add("instantiating a large root", function () {
    LargeRoot.createReadOnly(snapshot);
  });

  await suite.warmup();
  await suite.run();
  console.table(suite.table());
})();

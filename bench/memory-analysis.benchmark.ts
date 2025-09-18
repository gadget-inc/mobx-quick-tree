import { benchmarker } from "./benchmark";
import { TestModel, BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { State } from "../spec/fixtures/StateChart";
import { $type, $readOnly, $parent } from "../src/symbols";
import fs from "fs";
import findRoot from "find-root";

const largeSnapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  suite
    .add("memory: createReadOnly small model", function () {
      const instances: any[] = [];
      for (let i = 0; i < 100; i++) {
        instances.push(TestModel.createReadOnly(BigTestModelSnapshot));
      }
      return instances;
    })
    .add("memory: createReadOnly large model", function () {
      const instances: any[] = [];
      for (let i = 0; i < 10; i++) {
        instances.push(LargeRoot.createReadOnly(largeSnapshot));
      }
      return instances;
    })
    .add("memory: createReadOnly with references", function () {
      const instances: any[] = [];
      for (let i = 0; i < 50; i++) {
        instances.push(State.createReadOnly({
          id: `root-${i}`,
          childStates: [
            { id: `child-${i}-1` },
            { id: `child-${i}-2` },
            { id: `child-${i}-3` }
          ],
          initialChildState: `child-${i}-2`,
        }));
      }
      return instances;
    })
    .add("memory: property access patterns", function () {
      const instance = TestModel.createReadOnly(BigTestModelSnapshot);
      const results: any[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(instance.notBool);
        results.push(instance.arrayLength);
        results.push(instance.nested.lowerCasedName());
      }
      return results;
    })
    .add("memory: symbol metadata overhead", function () {
      const instances: any[] = [];
      for (let i = 0; i < 200; i++) {
        const instance = TestModel.createReadOnly(BigTestModelSnapshot);
        instances.push({
          type: (instance as any)[$type],
          readOnly: (instance as any)[$readOnly],
          parent: (instance as any)[$parent]
        });
      }
      return instances;
    });

  return suite;
});

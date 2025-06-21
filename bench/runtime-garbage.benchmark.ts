import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { NameExample } from "../spec/fixtures/NameExample";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { benchmarker } from "./benchmark";
import { measureRuntimeAllocation, forceGC } from "./memory-utils";
import findRoot from "find-root";
import fs from "fs";

const snapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));

export default benchmarker(async (suite) => {
  suite
    .add("runtime allocation: small model instantiation", async function () {
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => NameExample.createReadOnly({ key: "test", name: "test" }),
        100,
        10
      );
      console.log(`Average allocation per small model: ${averageAllocationPerIteration} bytes`);
    })
    .add("runtime allocation: diverse model instantiation", async function () {
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => TestClassModel.createReadOnly(BigTestModelSnapshot),
        100,
        10
      );
      console.log(`Average allocation per diverse model: ${averageAllocationPerIteration} bytes`);
    })
    .add("runtime allocation: large model instantiation", async function () {
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => LargeRoot.createReadOnly(snapshot),
        50,
        5
      );
      console.log(`Average allocation per large model: ${averageAllocationPerIteration} bytes`);
    })
    .add("runtime allocation: property access on cached instance", async function () {
      const instance = TestClassModel.createReadOnly(BigTestModelSnapshot);
      forceGC();
      
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => {
          instance.bool;
          instance.nested?.name;
          instance.array;
          instance.map;
        },
        1000,
        100
      );
      console.log(`Average allocation per property access: ${averageAllocationPerIteration} bytes`);
    })
    .add("runtime allocation: repeated instantiation vs compilation", async function () {
      const firstTime = await measureRuntimeAllocation(
        () => TestClassModel.createReadOnly(BigTestModelSnapshot),
        1,
        0
      );
      
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const subsequentTimes = await measureRuntimeAllocation(
        () => TestClassModel.createReadOnly(BigTestModelSnapshot),
        100,
        10
      );
      
      console.log(`First instantiation (includes compilation): ${firstTime.averageAllocationPerIteration} bytes`);
      console.log(`Subsequent instantiations (runtime only): ${subsequentTimes.averageAllocationPerIteration} bytes`);
      console.log(`Compilation overhead: ${firstTime.averageAllocationPerIteration - subsequentTimes.averageAllocationPerIteration} bytes`);
    });

  return suite;
});

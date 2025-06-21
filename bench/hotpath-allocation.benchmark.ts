import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { State } from "../spec/fixtures/StateChart";
import { benchmarker } from "./benchmark";
import { measureRuntimeAllocation, forceGC } from "./memory-utils";

export default benchmarker(async (suite) => {
  suite
    .add("hotpath allocation: TreeContext creation", async function () {
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => {
          const context = {
            referenceCache: new Map(),
            referencesToResolve: [] as (() => void)[],
            env: undefined,
          };
          context.referenceCache.set("test", {} as any);
          context.referencesToResolve.push(() => {});
        },
        1000,
        100
      );
      console.log(`Average allocation per TreeContext creation: ${averageAllocationPerIteration} bytes`);
    })
    .add("hotpath allocation: reference resolution objects", async function () {
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => {
          const referencesToResolve: any[] = [];
          for (let i = 0; i < 5; i++) {
            referencesToResolve.push({
              owner: {},
              identifier: `ref-${i}`,
              property: `prop-${i}`,
              required: true,
              instantiateUsing: null,
            });
          }
        },
        1000,
        100
      );
      console.log(`Average allocation per reference resolution batch: ${averageAllocationPerIteration} bytes`);
    })
    .add("hotpath allocation: reference resolution during instantiation", async function () {
      const referenceSnapshot = {
        id: "root",
        childStates: [
          { id: "child1" },
          { id: "child2" },
          { id: "child3" },
        ],
        initialChildState: "child2",
      };
      
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => State.createReadOnly(referenceSnapshot),
        100,
        10
      );
      console.log(`Average allocation per reference-heavy instantiation: ${averageAllocationPerIteration} bytes`);
    })
    .add("hotpath allocation: memoization during property access", async function () {
      const instances = Array.from({ length: 10 }, () => 
        TestClassModel.createReadOnly(BigTestModelSnapshot)
      );
      
      forceGC();
      
      const { averageAllocationPerIteration } = await measureRuntimeAllocation(
        () => {
          for (const instance of instances) {
            instance.bool;
            instance.nested?.name;
            instance.array?.length;
          }
        },
        1000,
        100
      );
      console.log(`Average allocation per memoized property access batch: ${averageAllocationPerIteration} bytes`);
    })
    .add("hotpath allocation: fresh vs memoized property access", async function () {
      const freshInstance = () => TestClassModel.createReadOnly(BigTestModelSnapshot);
      const cachedInstance = TestClassModel.createReadOnly(BigTestModelSnapshot);
      
      forceGC();
      
      const freshAccess = await measureRuntimeAllocation(
        () => {
          const instance = freshInstance();
          instance.bool;
          instance.nested?.name;
        },
        100,
        10
      );
      
      forceGC();
      
      const cachedAccess = await measureRuntimeAllocation(
        () => {
          cachedInstance.bool;
          cachedInstance.nested?.name;
        },
        1000,
        100
      );
      
      console.log(`Fresh property access allocation: ${freshAccess.averageAllocationPerIteration} bytes`);
      console.log(`Cached property access allocation: ${cachedAccess.averageAllocationPerIteration} bytes`);
      console.log(`Memoization savings: ${freshAccess.averageAllocationPerIteration - cachedAccess.averageAllocationPerIteration} bytes`);
    });

  return suite;
});

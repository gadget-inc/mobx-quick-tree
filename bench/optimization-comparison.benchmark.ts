import { benchmarker } from "./benchmark";
import { TestModel, BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { getSymbolPoolSize, clearSymbolPool } from "../src/symbol-pool";
import { getClassCacheSize, clearClassCache } from "../src/class-cache";

export default benchmarker(async (suite) => {
  suite
    .add("optimization: symbol pool usage", function () {
      clearSymbolPool();
      const instances: any[] = [];
      for (let i = 0; i < 100; i++) {
        instances.push(TestModel.createReadOnly(BigTestModelSnapshot));
      }
      const poolSize = getSymbolPoolSize();
      return { instances, poolSize };
    })
    .add("optimization: class template caching", function () {
      clearClassCache();
      const instances: any[] = [];
      for (let i = 0; i < 50; i++) {
        instances.push(TestModel.createReadOnly(BigTestModelSnapshot));
      }
      const cacheSize = getClassCacheSize();
      return { instances, cacheSize };
    })
    .add("optimization: reference cache efficiency", function () {
      const instances: any[] = [];
      for (let i = 0; i < 100; i++) {
        const instance = TestModel.createReadOnly({
          ...BigTestModelSnapshot,
          nested: { key: `test-${i}`, name: `Test ${i}` }
        });
        instances.push(instance);
      }
      return instances;
    });

  return suite;
});

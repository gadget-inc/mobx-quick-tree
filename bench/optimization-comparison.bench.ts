import { benchmarker } from "./benchmark";
import { TestModel, BigTestModelSnapshot } from "../spec/fixtures/TestModel";

export default benchmarker(async (suite) => {
  suite
    .add("memory profiling: small model instantiation", function () {
      const instances: any[] = [];
      for (let i = 0; i < 100; i++) {
        instances.push(TestModel.createReadOnly(BigTestModelSnapshot));
      }
      return instances;
    })
    .add("memory profiling: property access patterns", function () {
      const instance = TestModel.createReadOnly(BigTestModelSnapshot);
      const results: any[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(instance.notBool);
        results.push(instance.arrayLength);
        results.push(instance.nested.lowerCasedName());
      }
      return results;
    });

  return suite;
});

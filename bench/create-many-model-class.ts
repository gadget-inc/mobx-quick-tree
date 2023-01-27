import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";

for (let x = 0; x < 50_000; ++x) {
  TestClassModel.createReadOnly(BigTestModelSnapshot);
}

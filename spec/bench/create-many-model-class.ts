import { create } from "../../src";
import { TestClassModel } from "../fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../fixtures/TestModel";

for (let x = 0; x < 50_000; ++x) {
  create(TestClassModel, BigTestModelSnapshot, true);
}

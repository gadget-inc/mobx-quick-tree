import { create } from "../../src";
import { BigTestModelSnapshot, TestModel } from "../fixtures/TestModel";

for (let x = 0; x < 50_000; ++x) {
  create(TestModel, BigTestModelSnapshot, true);
}

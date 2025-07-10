import findRoot from "find-root";
import fs from "fs";
import { pack, unpack } from "msgpackr";
import { LargeRoot } from "../spec/fixtures/LargeRoot";
import { TestClassModel } from "../spec/fixtures/TestClassModel";
import { BigTestModelSnapshot } from "../spec/fixtures/TestModel";
import { NameExample } from "../spec/fixtures/NameExample";
import { enableMsgpackrIntegration } from "../src/msgpackr-instantiator";
import { benchmarker } from "./benchmark";

const largeRootSnapshot = JSON.parse(fs.readFileSync(findRoot(__dirname) + "/spec/fixtures/large-root-snapshot.json", "utf8"));
const largeRootMsgpack = pack(largeRootSnapshot);

const bigTestModelMsgpack = pack(BigTestModelSnapshot);
const smallTestSnapshot = { key: "test", name: "test" };
const smallTestMsgpack = pack(smallTestSnapshot);

const LargeRootWithMsgpackr = enableMsgpackrIntegration(LargeRoot);
const TestClassModelWithMsgpackr = enableMsgpackrIntegration(TestClassModel);
const NameExampleWithMsgpackr = enableMsgpackrIntegration(NameExample);

export default benchmarker(async (suite) => {
  suite
    .add("baseline: large root msgpack.unpack + createReadOnly", function () {
      const unpacked = unpack(largeRootMsgpack);
      LargeRoot.createReadOnly(unpacked);
    })
    .add("fused: large root createReadOnlyFromMsgpack", function () {
      LargeRootWithMsgpackr.createReadOnlyFromMsgpack(largeRootMsgpack);
    })
    .add("baseline: diverse model msgpack.unpack + createReadOnly", function () {
      const unpacked = unpack(bigTestModelMsgpack);
      TestClassModel.createReadOnly(unpacked);
    })
    .add("fused: diverse model createReadOnlyFromMsgpack", function () {
      TestClassModelWithMsgpackr.createReadOnlyFromMsgpack(bigTestModelMsgpack);
    })
    .add("baseline: small model msgpack.unpack + createReadOnly", function () {
      const unpacked = unpack(smallTestMsgpack);
      NameExample.createReadOnly(unpacked);
    })
    .add("fused: small model createReadOnlyFromMsgpack", function () {
      NameExampleWithMsgpackr.createReadOnlyFromMsgpack(smallTestMsgpack);
    });

  return suite;
});

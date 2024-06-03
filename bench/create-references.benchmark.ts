import { benchmarker } from "./benchmark";
import { State } from "../spec/fixtures/StateChart";

export default benchmarker(async (suite) => {
  suite
    .add("instantiating one reference", function () {
      State.createReadOnly({
        id: "root",
        childStates: [{ id: "child" }],
        initialChildState: "child",
      });
    })
    .add("instantiating deep references", function () {
      State.createReadOnly({
        id: "root",
        childStates: [
          {
            id: "one",
            childStates: [{ id: "alpha" }, { id: "beta" }, { id: "gamma", childStates: [{ id: "foxtrot" }], initialChildState: "foxtrot" }],
            initialChildState: "beta",
          },
          {
            id: "two",
            childStates: [{ id: "red" }, { id: "blue" }, { id: "green", childStates: [{ id: "apple" }], initialChildState: "apple" }],
            initialChildState: "blue",
          },
          {
            id: "three",
            childStates: [{ id: "soft" }, { id: "rough" }, { id: "bumpy", childStates: [{ id: "smelly" }], initialChildState: "smelly" }],
            initialChildState: "bumpy",
          },
          { id: "four" },
        ],
        initialChildState: "three",
      });
    });

  return suite;
});

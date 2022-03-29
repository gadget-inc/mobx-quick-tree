import { types } from "../src";

const Referrable = types.model("Referenced", {
  key: types.identifier,
  count: types.number,
});

const Referencer = types.model("Referencer", {
  ref: types.reference(Referrable),
  safeRef: types.safeReference(Referrable),
});

const Root = types.model("Reference Model", {
  model: Referencer,
  refs: types.array(Referrable),
});

test("can resolve valid references", () => {
  const root = Root.createReadOnly({
    model: {
      ref: "item-a",
    },
    refs: [
      { key: "item-a", count: 12 },
      { key: "item-b", count: 523 },
    ],
  });

  expect(root.model.ref).toEqual(
    expect.objectContaining({
      key: "item-a",
      count: 12,
    })
  );
});

test("throws for invalid refs", () => {
  const createRoot = () =>
    Root.createReadOnly({
      model: {
        ref: "item-c",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

  expect(createRoot).toThrow();
});

test("can resolve valid safe references", () => {
  const root = Root.createReadOnly({
    model: {
      ref: "item-a",
      safeRef: "item-b",
    },
    refs: [
      { key: "item-a", count: 12 },
      { key: "item-b", count: 523 },
    ],
  });

  expect(root.model.safeRef).toEqual(
    expect.objectContaining({
      key: "item-b",
      count: 523,
    })
  );
});

test("does not throw for invalid safe references", () => {
  const root = Root.createReadOnly({
    model: {
      ref: "item-a",
      safeRef: "item-c",
    },
    refs: [
      { key: "item-a", count: 12 },
      { key: "item-b", count: 523 },
    ],
  });

  expect(root.model.safeRef).toBeUndefined();
});

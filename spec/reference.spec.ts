import { Instance, types } from "../src";

const Referrable = types.model("Referenced", {
  key: types.identifier,
  count: types.number,
});

const Referencer = types
  .model("Referencer", {
    ref: types.reference(Referrable),
    safeRef: types.safeReference(Referrable),
  })
  .actions((self) => ({
    setRef(ref: Instance<typeof Referrable>) {
      // Just here for typechecking
      self.ref = ref;
    },
  }));

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

test("references are equal to the instances they refer to", () => {
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

  expect(root.model.ref).toBe(root.refs[0]);
  expect(root.model.ref).toEqual(root.refs[0]);
  expect(root.model.ref).toStrictEqual(root.refs[0]);
});

test("safe references are equal to the instances they refer to", () => {
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

  expect(root.model.safeRef).toBe(root.refs[1]);
  expect(root.model.safeRef).toEqual(root.refs[1]);
  expect(root.model.safeRef).toStrictEqual(root.refs[1]);
});

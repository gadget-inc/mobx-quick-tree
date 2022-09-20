import { types } from "../src";

const InventoryItem = types.model("Inventory Item", {
  name: types.identifier,
  amount: types.optional(types.number, 0),
});

test("can create a map of simple types", () => {
  const mapType = types.map(types.string);
  expect(mapType.createReadOnly().toJSON()).toEqual({});
  expect(mapType.createReadOnly({ a: "A", b: "B" }).toJSON()).toEqual(expect.objectContaining({ a: "A", b: "B" }));
});

test("is can create a map of frozen types from a snapshot", () => {
  const mapType = types.map(types.frozen<string | null>());
  const snapshot = { A: "one", B: null };
  expect(mapType.createReadOnly(snapshot).toJSON()).toEqual(
    expect.objectContaining({
      A: "one",
      B: null,
    })
  );
});

test("can create a map of complex types", () => {
  const mapType = types.map(InventoryItem);

  expect(mapType.createReadOnly().toJSON()).toEqual({});
  expect(mapType.createReadOnly({ A: { name: "A", amount: 10 }, B: { name: "B" } }).toJSON()).toEqual(
    expect.objectContaining({
      A: expect.objectContaining({ name: "A", amount: 10 }),
      B: expect.objectContaining({ name: "B", amount: 0 }),
    })
  );
});

test("is can verify map types", () => {
  const mapType = types.map(types.string);
  expect(mapType.is({})).toEqual(true);
  expect(mapType.is({ a: "A", b: "B" })).toEqual(true);
  expect(mapType.is([])).toEqual(false);
  expect(mapType.is([1, 2, 3])).toEqual(false);
  expect(mapType.is("")).toEqual(false);
});

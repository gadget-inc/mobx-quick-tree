import { types } from "../src";

test("can create a map of simple types", () => {
  const mapType = types.map(types.string);
  expect(mapType.createReadOnly()).toEqual({});
  expect(mapType.createReadOnly({ a: "A", b: "B" })).toEqual(expect.objectContaining({ a: "A", b: "B" }));
});

test("can create a map of complex types", () => {
  const inventoryType = types.model("Inventory Item", {
    itemName: types.string,
    amount: types.optional(types.number, 0),
  });

  const mapType = types.map(inventoryType);

  expect(mapType.createReadOnly()).toEqual({});
  expect(mapType.createReadOnly({ itemA: { itemName: "A", amount: 10 }, itemB: { itemName: "B" } })).toEqual(
    expect.objectContaining({
      itemA: expect.objectContaining({ itemName: "A", amount: 10 }),
      itemB: expect.objectContaining({ itemName: "B", amount: 0 }),
    })
  );
});

test("can create a map of complex types that have an identifier attribute", () => {
  const inventoryType = types.model("Inventory Item", {
    itemName: types.identifier,
    amount: types.optional(types.number, 0),
  });

  const mapType = types.map(inventoryType);
  expect(mapType.createReadOnly()).toEqual({});
  expect(mapType.createReadOnly({ itemA: { itemName: "A", amount: 10 }, itemB: { itemName: "B" } })).toEqual(
    expect.objectContaining({
      A: expect.objectContaining({ itemName: "A", amount: 10 }),
      B: expect.objectContaining({ itemName: "B", amount: 0 }),
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

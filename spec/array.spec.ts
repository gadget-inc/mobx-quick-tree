import { create, types } from "../src";

test("can create an array of simple types", () => {
  const arrayType = types.array(types.string);
  expect(create(arrayType, undefined, true)).toEqual([]);
  expect(create(arrayType, ["a", "b"], true)).toEqual(["a", "b"]);
});

test("can create an array of complex types", () => {
  const inventoryType = types.model("Inventory Item", {
    itemName: types.string,
    amount: types.optional(types.number, 0),
  });

  const arrayType = types.array(inventoryType);

  expect(create(arrayType, undefined, true)).toEqual([]);
  expect(create(arrayType, [{ itemName: "A", amount: 10 }, { itemName: "B" }], true)).toEqual([
    expect.objectContaining({ itemName: "A", amount: 10 }),
    expect.objectContaining({ itemName: "B", amount: 0 }),
  ]);
});

test("is can verify array types", () => {
  const arrayType = types.array(types.string);
  expect(arrayType.is([])).toEqual(true);
  expect(arrayType.is(["a", "b"])).toEqual(true);
  expect(arrayType.is([1, 2, 3])).toEqual(false);
  expect(arrayType.is("")).toEqual(false);
  expect(arrayType.is({})).toEqual(false);
});

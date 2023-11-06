import { types } from "../src";

test("can create an array of simple types", () => {
  const arrayType = types.array(types.string);
  expect(Array.from(arrayType.createReadOnly())).toEqual([]);
  expect(Array.from(arrayType.createReadOnly(["a", "b"]))).toEqual(["a", "b"]);
});

test("can create an array of complex types", () => {
  const inventoryType = types.model("Inventory Item", {
    itemName: types.string,
    amount: types.optional(types.number, 0),
  });

  const arrayType = types.array(inventoryType);

  expect(Array.from(arrayType.createReadOnly())).toEqual([]);
  expect(Array.from(arrayType.createReadOnly([{ itemName: "A", amount: 10 }, { itemName: "B" }]))).toEqual([
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

import { types } from "../src";
import { create } from "./helpers";

describe("late", () => {
  const modelType = types.model("Test", { a: types.optional(types.string, "default"), b: types.number });
  const lateType = types.late(() => modelType);

  test("can create a read-only instance", () => {
    expect(lateType.createReadOnly({ a: "my value", b: 2 })).toEqual({ a: "my value", b: 2 });
  });

  test("can create an observable instance", () => {
    expect(lateType.create({ a: "my value", b: 2 })).toEqual({ a: "my value", b: 2 });
  });

  test("can be verified with is", () => {
    expect(lateType.is({ a: "default", b: 2 })).toEqual(true);
    expect(lateType.is({ a: "default" })).toEqual(false);
    expect(lateType.is(null)).toEqual(false);
    expect(lateType.is("not testing")).toEqual(false);
    expect(lateType.is(true)).toEqual(false);
    expect(lateType.is({})).toEqual(false);
  });

  test("readonly type name and mst type name shows the actual type being late bound", () => {
    const Example = types.model("Example", {
      a: types.optional(types.string, "default"),
    });

    const Late = types.late(() => Example);
    expect(Late.name).toMatchInlineSnapshot(`"late(()=>Example)"`);
    expect(Late.mstType.name).toMatchInlineSnapshot(`"late(()=>Example)"`);
  });

  const Apple = types.model("Apple", {
    type: "Apple",
    color: types.string,
  });

  const Banana = types.model("Banana", {
    type: "Banana",
    length: types.number,
  });

  const Fruit = types.union(Apple, Banana);
  const Basket = types.model("Basket", {
    fruits: types.array(Fruit),
  });

  const LateBasket = types.model("Basket", {
    fruits: types.array(types.late(() => Fruit)),
  });

  const LateLateBasket = types.late(() => LateBasket);

  describe.each([
    ["eager binding", Basket],
    ["late binding", LateBasket],
    ["multiple levels of late binding", LateLateBasket],
  ])("%s", (_, Type) => {
    describe.each([
      ["readonly", true],
      ["observable", false],
    ])("%s", (_, observable) => {
      test("can be used in discriminated unions with input snapshots", () => {
        const basket = create(
          Type,
          {
            fruits: [
              {
                type: "Apple",
                color: "red",
              },
              {
                type: "Apple",
                color: "green",
              },
              {
                type: "Banana",
                length: 5,
              },
            ],
          },
          observable,
        );

        expect(basket.fruits.length).toBe(3);
        expect(Apple.is(basket.fruits[0])).toBe(true);
        expect(Banana.is(basket.fruits[2])).toBe(true);
      });

      test("can be used in discriminated unions with instances", () => {
        const apple = create(Apple, { color: "red" }, observable);
        const banana = create(Banana, { length: 3 }, observable);

        const basket = create(
          Type,
          {
            fruits: [apple, banana],
          },
          observable,
        );

        expect(basket.fruits.length).toBe(2);
        expect(Apple.is(basket.fruits[0])).toBe(true);
        expect(Banana.is(basket.fruits[1])).toBe(true);
      });
    });
  });
});

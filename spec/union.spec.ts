import { getSnapshot, types } from "../src";
import { create } from "./helpers";

describe("union", () => {
  const unionType = types.union(types.literal("value 1"), types.literal("value 2"));

  test("can be verified with is", () => {
    expect(unionType.is("value 1")).toEqual(true);
    expect(unionType.is("value 2")).toEqual(true);
    expect(unionType.is("value 3")).toEqual(false);
    expect(unionType.is(null)).toEqual(false);
    expect(unionType.is(true)).toEqual(false);
    expect(unionType.is({})).toEqual(false);
  });

  describe.each([
    ["readonly", true],
    ["observable", false],
  ])("%s nodes", (_, readonly) => {
    test("can create an instance", () => {
      expect(create(unionType, "value 1", readonly)).toEqual("value 1");
      expect(create(unionType, "value 2", readonly)).toEqual("value 2");
      expect(() => create(unionType, "value 3" as any, readonly)).toThrow();
    });

    test("can create an eager, read-only instance", () => {
      const unionType = types.lazyUnion(types.literal("value 1"), types.literal("value 2"));
      expect(create(unionType, "value 1", readonly)).toEqual("value 1");
      expect(create(unionType, "value 2", readonly)).toEqual("value 2");
      expect(() => create(unionType, "value 3" as any, readonly)).toThrow();
    });

    test("can create a union of model types", () => {
      const modelTypeA = types.model({ x: types.string });
      const modelTypeB = types.model({ y: types.number });
      const unionType = types.union(modelTypeA, modelTypeB);
      const unionInstance = create(unionType, { x: "test" }, readonly);

      expect(getSnapshot(unionInstance)).toEqual(
        expect.objectContaining({
          x: "test",
        }),
      );
    });

    test("nested unions", () => {
      const one = types.union(types.literal("A"), types.literal("B"));
      const two = types.union(types.literal("C"), types.literal("D"));
      const Union = types.union(one, two);

      const aInstance = create(Union, "A", readonly);
      expect(aInstance).toEqual("A");

      const dInstance = create(Union, "D", readonly);
      expect(dInstance).toEqual("D");
    });

    describe("with an explicit dispatcher option", () => {
      test("can use a dispatcher", () => {
        const Apple = types.model({ color: types.string });
        const Banana = types.model({ ripeness: types.number });
        const Union = types.union(
          {
            dispatcher: (snapshot: any) => {
              if (snapshot.color) {
                return Apple;
              } else {
                return Banana;
              }
            },
          },
          Apple,
          Banana,
        );

        const appleInstance = create(Union, { color: "red" }, readonly);
        expect(Apple.is(appleInstance)).toBeTruthy();
        expect(Banana.is(appleInstance)).toBeFalsy();

        const bananaInstance = create(Union, { ripeness: 2 }, readonly);
        expect(Apple.is(bananaInstance)).toBeFalsy();
        expect(Banana.is(bananaInstance)).toBeTruthy();
      });
    });

    describe("with an explicit discriminator property", () => {
      test("can use a literal discriminator", () => {
        const Apple = types.model({ type: types.literal("apple"), color: types.string });
        const Banana = types.model({ type: types.literal("banana"), ripeness: types.number });
        const Union = types.union({ discriminator: "type" }, Apple, Banana);

        const appleInstance = create(Union, { type: "apple", color: "red" }, readonly);
        expect(Apple.is(appleInstance)).toBeTruthy();
        expect(Banana.is(appleInstance)).toBeFalsy();

        const bananaInstance = create(Union, { type: "banana", ripeness: 2 }, readonly);
        expect(Apple.is(bananaInstance)).toBeFalsy();
        expect(Banana.is(bananaInstance)).toBeTruthy();
      });

      test("can use an optional literal discriminator", () => {
        const Apple = types.model({ type: types.optional(types.literal("apple"), "apple"), color: types.string });
        const Banana = types.model({ type: types.optional(types.literal("banana"), "banana"), ripeness: types.number });
        const Union = types.union({ discriminator: "type" }, Apple, Banana);

        const appleInstance = create(Union, { type: "apple", color: "red" }, readonly);
        expect(Apple.is(appleInstance)).toBeTruthy();
        expect(Banana.is(appleInstance)).toBeFalsy();

        const bananaInstance = create(Union, { type: "banana", ripeness: 2 }, readonly);
        expect(Apple.is(bananaInstance)).toBeFalsy();
        expect(Banana.is(bananaInstance)).toBeTruthy();
      });

      test("does not get an error when passing a snapshot that doesn't have a value for the discriminator property", () => {
        const Apple = types.model({ type: types.optional(types.literal("apple"), "apple"), color: types.string });
        const Banana = types.model({ type: types.optional(types.literal("banana"), "banana"), ripeness: types.number });
        const Union = types.union({ discriminator: "type" }, Apple, Banana);

        const apple = create(Union, { color: "red" }, readonly);
        expect(Apple.is(apple)).toBeTruthy();
      });

      test("can use an literal discriminators within nested unions", () => {
        const Apple = types.model({ type: types.optional(types.literal("apple"), "apple"), color: types.string });
        const Banana = types.model({ type: types.optional(types.literal("banana"), "banana"), ripeness: types.number });
        const InnerUnion = types.union({ discriminator: "type" }, Apple, Banana);
        const Pear = types.model({ type: types.optional(types.literal("pear"), "pear"), species: types.string });
        const Union = types.union({ discriminator: "type" }, InnerUnion, Pear);

        const appleInstance = create(Union, { type: "apple", color: "red" }, readonly);
        expect(Apple.is(appleInstance)).toBeTruthy();
        expect(Banana.is(appleInstance)).toBeFalsy();
        expect(Pear.is(appleInstance)).toBeFalsy();

        const bananaInstance = create(Union, { type: "banana", ripeness: 2 }, readonly);
        expect(Apple.is(bananaInstance)).toBeFalsy();
        expect(Banana.is(bananaInstance)).toBeTruthy();
        expect(Pear.is(bananaInstance)).toBeFalsy();

        const pearInstance = create(Union, { type: "pear", species: "anjou" }, readonly);
        expect(Apple.is(pearInstance)).toBeFalsy();
        expect(Banana.is(pearInstance)).toBeFalsy();
        expect(Pear.is(pearInstance)).toBeTruthy();
      });
    });
  });

  test("gets an error when passing a snapshot that has an unrecognized value for the discriminator property", () => {
    const Apple = types.model({ type: types.optional(types.literal("apple"), "apple"), color: types.string });
    const Banana = types.model({ type: types.optional(types.literal("banana"), "banana"), ripeness: types.number });
    const Union = types.union({ discriminator: "type" }, Apple, Banana);

    expect(() => create(Union, { type: "pear" } as any, true)).toThrowErrorMatchingInlineSnapshot(
      `"Discriminator property value \`pear\` for property \`type\` on incoming snapshot didn't correspond to a type. Options: apple, banana. Snapshot was \`{"type":"pear"}\`"`,
    );
  });
});

import { create, getSnapshot, types } from "../src";

describe("boolean", () => {
  test("can create a read-only instance", () => {
    expect(create(types.boolean, true, true)).toEqual(true);
    expect(create(types.boolean, false, true)).toEqual(false);
  });

  test("can be verified with is", () => {
    expect(types.boolean.is(true)).toEqual(true);
    expect(types.boolean.is(false)).toEqual(true);
    expect(types.boolean.is("")).toEqual(false);
    expect(types.boolean.is({})).toEqual(false);
  });
});

describe("string", () => {
  test("can create a read-only instance", () => {
    expect(create(types.string, "", true)).toEqual("");
    expect(create(types.string, "words", true)).toEqual("words");
  });

  test("can be verified with is", () => {
    expect(types.string.is("")).toEqual(true);
    expect(types.string.is("words")).toEqual(true);
    expect(types.string.is(null)).toEqual(false);
    expect(types.string.is(true)).toEqual(false);
    expect(types.string.is({})).toEqual(false);
  });
});

describe("Date", () => {
  test("can create a read-only instance", () => {
    const date = new Date();
    expect(create(types.Date, date.getTime(), true)).toEqual(date);
    expect(create(types.Date, date, true)).toEqual(date);
  });

  test("can be verified with is", () => {
    expect(types.Date.is(123)).toEqual(true);
    expect(types.Date.is(new Date())).toEqual(true);
    expect(types.Date.is("")).toEqual(false);
    expect(types.Date.is(null)).toEqual(false);
    expect(types.Date.is(true)).toEqual(false);
    expect(types.Date.is({})).toEqual(false);
  });
});

describe("late", () => {
  const modelType = types.model("Test", { a: types.optional(types.string, "default"), b: types.number });
  const lateType = types.late(() => modelType);

  test("can create a read-only instance", () => {
    expect(create(lateType, { a: "my value", b: 2 }, true)).toEqual({ a: "my value", b: 2 });
  });

  test("can be verified with is", () => {
    expect(lateType.is({ a: "default", b: 2 })).toEqual(true);
    expect(lateType.is({ a: "default" })).toEqual(false);
    expect(lateType.is(null)).toEqual(false);
    expect(lateType.is("not testing")).toEqual(false);
    expect(lateType.is(true)).toEqual(false);
    expect(lateType.is({})).toEqual(false);
  });
});

describe("maybe", () => {
  const maybeType = types.maybe(types.string);

  test("can create a read-only instance", () => {
    expect(create(maybeType, undefined, true)).toEqual(undefined);
    expect(create(maybeType, undefined, true)).toEqual(undefined);
    expect(create(maybeType, "value 2", true)).toEqual("value 2");
  });

  test("can be verified with is", () => {
    expect(maybeType.is(undefined)).toEqual(true);
    expect(maybeType.is("not testing")).toEqual(true);
    expect(maybeType.is(null)).toEqual(false);
    expect(maybeType.is(true)).toEqual(false);
    expect(maybeType.is({})).toEqual(false);
  });
});

describe("maybeNull", () => {
  const maybeNullType = types.maybeNull(types.string);

  test("can create a read-only instance", () => {
    expect(create(maybeNullType, null, true)).toEqual(null);
    expect(create(maybeNullType, undefined, true)).toEqual(null);
    expect(create(maybeNullType, "value 2", true)).toEqual("value 2");
  });

  test("can be verified with is", () => {
    expect(maybeNullType.is(null)).toEqual(true);
    expect(maybeNullType.is(undefined)).toEqual(true);
    expect(maybeNullType.is("not testing")).toEqual(true);
    expect(maybeNullType.is(true)).toEqual(false);
    expect(maybeNullType.is({})).toEqual(false);
  });
});

describe("literal", () => {
  const literal = types.literal("testing");

  test("can create a read-only instance", () => {
    expect(create(literal, "testing", true)).toEqual("testing");
    expect(() => create(literal, undefined, true)).toThrow();
    expect(() => create(literal, true as any, true)).toThrow();
  });

  test("can be verified with is", () => {
    expect(literal.is("testing")).toEqual(true);
    expect(literal.is("not testing")).toEqual(false);
    expect(literal.is(null)).toEqual(false);
    expect(literal.is(true)).toEqual(false);
    expect(literal.is({})).toEqual(false);
  });
});

describe("union", () => {
  const unionType = types.union(types.literal("value 1"), types.literal("value 2"));

  test("can create a read-only instance", () => {
    expect(create(unionType, "value 1", true)).toEqual("value 1");
    expect(create(unionType, "value 2", true)).toEqual("value 2");
    expect(() => create(unionType, "value 3" as any, true)).toThrow();
  });

  test("can create an eager, read-only instance", () => {
    const unionType = types.lazyUnion(types.literal("value 1"), types.literal("value 2"));
    expect(create(unionType, "value 1", true)).toEqual("value 1");
    expect(create(unionType, "value 2", true)).toEqual("value 2");
    expect(() => create(unionType, "value 3" as any, true)).toThrow();
  });

  test("can be verified with is", () => {
    expect(unionType.is("value 1")).toEqual(true);
    expect(unionType.is("value 2")).toEqual(true);
    expect(unionType.is("value 3")).toEqual(false);
    expect(unionType.is(null)).toEqual(false);
    expect(unionType.is(true)).toEqual(false);
    expect(unionType.is({})).toEqual(false);
  });

  test("can create a union of model types", () => {
    const modelTypeA = types.model({ x: types.string });
    const modelTypeB = types.model({ y: types.number });
    const unionType = types.union(modelTypeA, modelTypeB);
    const unionInstance = create(unionType, { x: "test" }, true);

    expect(getSnapshot(unionInstance)).toEqual(
      expect.objectContaining({
        x: "test",
      })
    );
  });
});

describe("refinement", () => {
  const smallStringsType = types.refinement(types.string, (v: string) => v.length <= 5);

  test("can create a read-only instance", () => {
    expect(create(smallStringsType, "small", true)).toEqual("small");
    expect(() => create(smallStringsType, "too big", true)).toThrow();
  });

  test("can be verified with is", () => {
    expect(smallStringsType.is("small")).toEqual(true);
    expect(smallStringsType.is("too big")).toEqual(false);
    expect(smallStringsType.is(null)).toEqual(false);
    expect(smallStringsType.is(true)).toEqual(false);
    expect(smallStringsType.is({})).toEqual(false);
  });
});

describe("custom", () => {
  type InputType = string;
  type InstanceType = string[];
  const csvType = types.custom<InputType, InstanceType>({
    name: "Comma-separate Values",
    fromSnapshot(snapshot: InputType, _env?: any): InstanceType {
      return snapshot.split(",");
    },
    toSnapshot(value: InstanceType): InputType {
      return value.join(",");
    },
    isTargetType(value: InputType | InstanceType): boolean {
      return typeof value == "string";
    },
    getValidationMessage(snapshot: InputType): string {
      if (this.isTargetType(snapshot)) return "";
      return "not a string";
    },
  });

  test("can create a read-only instance", () => {
    expect(create(csvType, "a", true)).toEqual(["a"]);
    expect(create(csvType, "a,b,c", true)).toEqual(["a", "b", "c"]);
    expect(() => create(csvType, undefined, true)).toThrow();
  });

  test("can be verified with is", () => {
    expect(csvType.is("a")).toEqual(true);
    expect(csvType.is("a,b,c")).toEqual(true);
    expect(csvType.is(null)).toEqual(false);
    expect(csvType.is(true)).toEqual(false);
    expect(csvType.is({})).toEqual(false);
  });
});

describe("enumeration", () => {
  const enumType = types.enumeration<"a" | "b">(["a", "b"]);
  const _enumTypeWithConst = types.enumeration<"a" | "b">(["a", "b"] as const);

  test("can create a read-only instance", () => {
    expect(create(enumType, "a", true)).toEqual("a");
    expect(create(enumType, "b", true)).toEqual("b");
    expect(() => create(enumType, "c" as any, true)).toThrow();
  });

  test("can create a read-only instance with a name", () => {
    const enumType = types.enumeration<"a" | "b">("AB", ["a", "b"]);
    expect(enumType.name).toEqual("AB");
    expect(create(enumType, "a", true)).toEqual("a");
    expect(create(enumType, "b", true)).toEqual("b");
    expect(() => create(enumType, "c" as any, true)).toThrow();
  });

  test("can create a read-only instance with a TypeScript enum", () => {
    enum Colors {
      Red = "Red",
      Green = "Green",
    }

    const enumType = types.enumeration<Colors>("Color", Object.values(Colors));
    expect(enumType.name).toEqual("Color");
    expect(create(enumType, Colors.Red, true)).toEqual("Red");
    expect(create(enumType, Colors.Green, true)).toEqual("Green");
    expect(() => create(enumType, "c" as any, true)).toThrow();
  });

  test("can be verified with is", () => {
    expect(enumType.is("a")).toEqual(true);
    expect(enumType.is("b")).toEqual(true);
    expect(enumType.is("c")).toEqual(false);
    expect(enumType.is("")).toEqual(false);
    expect(enumType.is(null)).toEqual(false);
    expect(enumType.is(true)).toEqual(false);
    expect(enumType.is({})).toEqual(false);
  });
});

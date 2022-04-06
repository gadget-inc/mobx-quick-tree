import { getSnapshot, types } from "../src";

describe("boolean", () => {
  test("can create a read-only instance", () => {
    expect(types.boolean.createReadOnly(true)).toEqual(true);
    expect(types.boolean.createReadOnly(false)).toEqual(false);
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
    expect(types.string.createReadOnly("")).toEqual("");
    expect(types.string.createReadOnly("words")).toEqual("words");
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
    expect(types.Date.createReadOnly(date.getTime())).toEqual(date);
    expect(types.Date.createReadOnly(date)).toEqual(date);
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
    expect(lateType.createReadOnly({ a: "my value", b: 2 })).toEqual({ a: "my value", b: 2 });
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
    expect(maybeType.createReadOnly()).toEqual(undefined);
    expect(maybeType.createReadOnly(undefined)).toEqual(undefined);
    expect(maybeType.createReadOnly("value 2")).toEqual("value 2");
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
    expect(maybeNullType.createReadOnly(null)).toEqual(null);
    expect(maybeNullType.createReadOnly(undefined)).toEqual(null);
    expect(maybeNullType.createReadOnly("value 2")).toEqual("value 2");
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
    expect(literal.createReadOnly("testing")).toEqual("testing");
    expect(() => literal.createReadOnly()).toThrow();
    expect(() => literal.createReadOnly(true as any)).toThrow();
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
    expect(unionType.createReadOnly("value 1")).toEqual("value 1");
    expect(unionType.createReadOnly("value 2")).toEqual("value 2");
    expect(() => unionType.createReadOnly("value 3" as any)).toThrow();
  });

  test("can create an eager, read-only instance", () => {
    const unionType = types.lazyUnion(types.literal("value 1"), types.literal("value 2"));
    expect(unionType.createReadOnly("value 1")).toEqual("value 1");
    expect(unionType.createReadOnly("value 2")).toEqual("value 2");
    expect(() => unionType.createReadOnly("value 3" as any)).toThrow();
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
    const unionInstance = unionType.createReadOnly({ x: "test" });

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
    expect(smallStringsType.createReadOnly("small")).toEqual("small");
    expect(() => smallStringsType.createReadOnly("too big")).toThrow();
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
    expect(csvType.createReadOnly("a")).toEqual(["a"]);
    expect(csvType.createReadOnly("a,b,c")).toEqual(["a", "b", "c"]);
    expect(() => csvType.createReadOnly()).toThrow();
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

  test("can create a read-only instance", () => {
    expect(enumType.createReadOnly("a")).toEqual("a");
    expect(enumType.createReadOnly("b")).toEqual("b");
    expect(() => enumType.createReadOnly("c" as any)).toThrow();
  });

  test("can create a read-only instance with a name", () => {
    const enumType = types.enumeration<"a" | "b">("AB", ["a", "b"]);
    expect(enumType.name).toEqual("AB");
    expect(enumType.createReadOnly("a")).toEqual("a");
    expect(enumType.createReadOnly("b")).toEqual("b");
    expect(() => enumType.createReadOnly("c" as any)).toThrow();
  });

  test("can create a read-only instance with a TypeScript enum", () => {
    enum Colors {
      Red = "Red",
      Green = "Green",
    }

    const enumType = types.enumeration<Colors>("Color", Object.values(Colors));
    expect(enumType.name).toEqual("Color");
    expect(enumType.createReadOnly(Colors.Red)).toEqual("Red");
    expect(enumType.createReadOnly(Colors.Green)).toEqual("Green");
    expect(() => enumType.createReadOnly("c" as any)).toThrow();
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

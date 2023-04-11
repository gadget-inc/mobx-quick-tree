import { types } from "../src";

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
  const _enumTypeWithConst = types.enumeration<"a" | "b">(["a", "b"] as const);

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

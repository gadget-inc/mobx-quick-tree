import { types } from "../src";

describe("can create", () => {
  test("a boolean type", () => {
    expect(types.boolean.createReadOnly(true)).toEqual(true);
    expect(types.boolean.createReadOnly(false)).toEqual(false);
  });

  test("a string type", () => {
    expect(types.string.createReadOnly("")).toEqual("");
    expect(types.string.createReadOnly("words")).toEqual("words");
  });

  test("a late type", () => {
    const modelType = types.model("Test", { a: types.optional(types.string, "default") });
    const lateType = types.late(() => modelType);
    expect(lateType.createReadOnly()).toEqual({ a: "default" });
    expect(lateType.createReadOnly({ a: "my value" })).toEqual({ a: "my value" });
  });

  test("a union type", () => {
    const unionType = types.union(types.literal("value 1"), types.literal("value 2"));
    expect(unionType.createReadOnly("value 1")).toEqual("value 1");
    expect(unionType.createReadOnly("value 2")).toEqual("value 2");
    expect(() => unionType.createReadOnly("value 3" as any)).toThrow();
  });
});

describe("is can verify", () => {
  test("a boolean type", () => {
    expect(types.boolean.is(true)).toEqual(true);
    expect(types.boolean.is(false)).toEqual(true);
    expect(types.boolean.is("")).toEqual(false);
    expect(types.boolean.is({})).toEqual(false);
  });

  test("a string type", () => {
    expect(types.string.is("")).toEqual(true);
    expect(types.string.is("words")).toEqual(true);
    expect(types.string.is(null)).toEqual(false);
    expect(types.string.is(true)).toEqual(false);
    expect(types.string.is({})).toEqual(false);
  });

  test("a literal type", () => {
    const literal = types.literal("testing");
    expect(literal.is("testing")).toEqual(true);
    expect(literal.is("not testing")).toEqual(false);
    expect(literal.is(null)).toEqual(false);
    expect(literal.is(true)).toEqual(false);
    expect(literal.is({})).toEqual(false);
  });

  test("a union type", () => {
    const unionType = types.union(types.literal("value 1"), types.literal("value 2"));
    expect(unionType.is("value 1")).toEqual(true);
    expect(unionType.is("value 2")).toEqual(true);
    expect(unionType.is("value 3")).toEqual(false);
    expect(unionType.is(null)).toEqual(false);
    expect(unionType.is(true)).toEqual(false);
    expect(unionType.is({})).toEqual(false);
  });
});

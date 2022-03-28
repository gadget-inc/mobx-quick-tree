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
});

describe("is", () => {
  test("can verify a boolean type", () => {
    expect(types.boolean.is(true)).toEqual(true);
    expect(types.boolean.is(false)).toEqual(true);
    expect(types.boolean.is("")).toEqual(false);
    expect(types.boolean.is({})).toEqual(false);
  });

  test("can verify a string type", () => {
    expect(types.string.is("")).toEqual(true);
    expect(types.string.is("words")).toEqual(true);
    expect(types.string.is(null)).toEqual(false);
    expect(types.string.is(true)).toEqual(false);
    expect(types.string.is({})).toEqual(false);
  });

  test("can verify a literal type", () => {
    const literal = types.literal("testing");
    expect(literal.is("testing")).toEqual(true);
    expect(literal.is("not testing")).toEqual(false);
    expect(literal.is(null)).toEqual(false);
    expect(literal.is(true)).toEqual(false);
    expect(literal.is({})).toEqual(false);
  });
});

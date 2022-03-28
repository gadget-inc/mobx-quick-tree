import { types } from "../src";

describe("is", () => {
  test("can verify a simple boolean type", () => {
    expect(types.boolean.is(true)).toEqual(true);
    expect(types.boolean.is(false)).toEqual(true);
    expect(types.boolean.is("")).toEqual(false);
    expect(types.boolean.is({})).toEqual(false);
  });

  test("can verify a simple string type", () => {
    expect(types.string.is("")).toEqual(true);
    expect(types.string.is("words")).toEqual(true);
    expect(types.string.is(null)).toEqual(false);
    expect(types.string.is(true)).toEqual(false);
    expect(types.string.is({})).toEqual(false);
  });

  test("can verify a simple literal type", () => {
    const literal = types.literal("testing");
    expect(literal.is("testing")).toEqual(true);
    expect(literal.is("not testing")).toEqual(false);
    expect(literal.is(null)).toEqual(false);
    expect(literal.is(true)).toEqual(false);
    expect(literal.is({})).toEqual(false);
  });
});

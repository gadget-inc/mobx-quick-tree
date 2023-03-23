import { types } from "../src";

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
});

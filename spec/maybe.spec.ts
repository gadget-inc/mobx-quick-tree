import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { Instance } from "../src";
import { types } from "../src";
import { TestClassModel } from "./fixtures/TestClassModel";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

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

  test("instances of maybe node models distribute", () => {
    const maybeNodeType = types.maybe(TestModel);
    const instance = maybeNodeType.create(TestModelSnapshot);
    expect(instance).toBeTruthy();
    assert<IsExact<typeof instance, Instance<typeof TestModel> | undefined>>(true);
  });

  test("instances of maybe class models can be asserted", () => {
    const maybeClassModelType = types.maybe(TestClassModel);
    const instance = maybeClassModelType.create(TestModelSnapshot);
    expect(instance).toBeTruthy();
    assert<IsExact<typeof instance, Instance<typeof TestClassModel> | undefined>>(true);
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

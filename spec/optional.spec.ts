import { create, types } from "../src";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("with no undefined values", () => {
  test("can create simple values", () => {
    const booleanType = types.optional(types.boolean, true);
    expect(create(booleanType, true, true)).toEqual(true);
    expect(create(booleanType, false, true)).toEqual(false);
    expect(create(booleanType, undefined, true)).toEqual(true);

    const stringType = types.optional(types.string, "default");
    expect(create(stringType, "test", true)).toEqual("test");
    expect(create(stringType, undefined, true)).toEqual("default");
  });

  test("can create complex values", () => {
    const modelType = types.optional(TestModel, TestModelSnapshot);
    const modelInstance = create(modelType, undefined, true);
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());
  });

  test("can create defaults with a function", () => {
    let x = 0;
    const optionalType = types.optional(types.string, () => `Item ${++x}`);
    expect(create(optionalType, undefined, true)).toEqual("Item 1");
    expect(create(optionalType, "my value", true)).toEqual("my value");
    expect(create(optionalType, undefined, true)).toEqual("Item 2");
  });
});

describe("with undefined values", () => {
  test("can create simple values", () => {
    const booleanType = types.optional(types.boolean, true, [undefined, null]);
    expect(create(booleanType, true, true)).toEqual(true);
    expect(create(booleanType, false, true)).toEqual(false);
    expect(create(booleanType, undefined, true)).toEqual(true);
    expect(create(booleanType, null, true)).toEqual(true);

    const stringType = types.optional(types.string, "default", [undefined, null, ""]);
    expect(create(stringType, "test", true)).toEqual("test");
    expect(create(stringType, undefined, true)).toEqual("default");
    expect(create(stringType, null, true)).toEqual("default");
    expect(create(stringType, "", true)).toEqual("default");
  });

  test("can create complex values", () => {
    const modelType = types.optional(TestModel, TestModelSnapshot, [undefined, null]);

    let modelInstance = create(modelType, undefined, true);
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());

    modelInstance = create(modelType, null, true);
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());
  });

  test("can create defaults with a function", () => {
    let x = 0;
    const optionalType = types.optional(types.string, () => `Item ${++x}`, [null, undefined]);
    expect(create(optionalType, undefined, true)).toEqual("Item 1");
    expect(create(optionalType, "my value", true)).toEqual("my value");
    expect(create(optionalType, null, true)).toEqual("Item 2");
  });
});

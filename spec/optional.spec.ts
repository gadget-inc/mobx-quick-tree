import { types } from "../src";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";

describe("with no undefined values", () => {
  test("can create simple values", () => {
    const booleanType = types.optional(types.boolean, true);
    expect(booleanType.createReadOnly(true)).toEqual(true);
    expect(booleanType.createReadOnly(false)).toEqual(false);
    expect(booleanType.createReadOnly()).toEqual(true);

    const stringType = types.optional(types.string, "default");
    expect(stringType.createReadOnly("test")).toEqual("test");
    expect(stringType.createReadOnly()).toEqual("default");
  });

  test("can create complex values", () => {
    const modelType = types.optional(TestModel, TestModelSnapshot);
    const modelInstance = modelType.createReadOnly();
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());
  });

  test("can create defaults with a function", () => {
    let x = 0;
    const optionalType = types.optional(types.string, () => `Item ${++x}`);
    expect(optionalType.createReadOnly()).toEqual("Item 1");
    expect(optionalType.createReadOnly("my value")).toEqual("my value");
    expect(optionalType.createReadOnly()).toEqual("Item 2");
  });
});

describe("with undefined values", () => {
  test("can create simple values", () => {
    const booleanType = types.optional(types.boolean, true, [undefined, null]);
    expect(booleanType.createReadOnly(true)).toEqual(true);
    expect(booleanType.createReadOnly(false)).toEqual(false);
    expect(booleanType.createReadOnly()).toEqual(true);
    expect(booleanType.createReadOnly(null)).toEqual(true);

    const stringType = types.optional(types.string, "default", [undefined, null, ""]);
    expect(stringType.createReadOnly("test")).toEqual("test");
    expect(stringType.createReadOnly()).toEqual("default");
    expect(stringType.createReadOnly(null)).toEqual("default");
    expect(stringType.createReadOnly("")).toEqual("default");
  });

  test("can create complex values", () => {
    const modelType = types.optional(TestModel, TestModelSnapshot, [undefined, null]);

    let modelInstance = modelType.createReadOnly();
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());

    modelInstance = modelType.createReadOnly(null);
    expect(modelInstance.bool).toEqual(TestModelSnapshot.bool);
    expect(modelInstance.frozen.test).toEqual(TestModelSnapshot.frozen.test);
    expect(modelInstance.nested.name).toEqual(TestModelSnapshot.nested.name);
    expect(modelInstance.nested.lowerCasedName()).toEqual(TestModelSnapshot.nested.name.toLowerCase());
  });

  test("can create defaults with a function", () => {
    let x = 0;
    const optionalType = types.optional(types.string, () => `Item ${++x}`, [null, undefined]);
    expect(optionalType.createReadOnly()).toEqual("Item 1");
    expect(optionalType.createReadOnly("my value")).toEqual("my value");
    expect(optionalType.createReadOnly(null)).toEqual("Item 2");
  });
});

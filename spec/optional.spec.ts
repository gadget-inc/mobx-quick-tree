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
});

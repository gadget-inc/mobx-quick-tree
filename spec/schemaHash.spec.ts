import { ClassModel, register, types } from "../src";

describe("schemaHash", () => {
  test("is the same for simple types of the same type", () => {
    expect(types.number.schemaHash()).toEqual(types.number.schemaHash());
    expect(types.number.schemaHash()).not.toEqual(types.string.schemaHash());
  });

  test("is not the same for late types of types", () => {
    expect(types.late(() => types.number).schemaHash()).toEqual(types.late(() => types.number).schemaHash());
    expect(types.number.schemaHash()).not.toEqual(types.late(() => types.number).schemaHash());
    expect(types.string.schemaHash()).not.toEqual(types.late(() => types.number).schemaHash());
  });

  test("is the same for enums with the same options", () => {
    expect(types.enumeration("whatever", ["foo", "bar"]).schemaHash()).toEqual(types.enumeration("other", ["foo", "bar"]).schemaHash());
    expect(types.enumeration("whatever", ["foo", "bar"]).schemaHash()).not.toEqual(
      types.enumeration("other", ["foo", "bar", "baz"]).schemaHash(),
    );
  });

  test("is the same for maps of the same type", () => {
    expect(types.map(types.number).schemaHash()).toEqual(types.map(types.number).schemaHash());
    expect(types.map(types.number).schemaHash()).not.toEqual(types.map(types.string).schemaHash());
  });

  test("is the same for arrays of the same type", () => {
    expect(types.array(types.number).schemaHash()).toEqual(types.array(types.number).schemaHash());
    expect(types.array(types.number).schemaHash()).not.toEqual(types.array(types.string).schemaHash());
  });

  test("is the same for refinements of a same type", () => {
    expect(types.refinement(types.number, () => true).schemaHash()).toEqual(types.refinement(types.number, () => true).schemaHash());
    expect(types.refinement(types.number, () => true).schemaHash()).not.toEqual(types.refinement(types.string, () => true).schemaHash());
  });

  test("is the same for all frozens", () => {
    expect(types.frozen().schemaHash()).toEqual(types.frozen().schemaHash());
  });

  test("is the same the same custom type, but different for different custom types", () => {
    const customA = types.custom({
      name: "testB",
      fromSnapshot: () => "foo",
      toSnapshot: () => "foo",
      isTargetType: () => true,
      getValidationMessage: () => "",
    });

    const customB = types.custom({
      name: "testA",
      fromSnapshot: () => "foo",
      toSnapshot: () => "foo",
      isTargetType: () => true,
      getValidationMessage: () => "",
    });

    expect(customA.schemaHash()).toEqual(customA.schemaHash());
    expect(customA.schemaHash()).not.toEqual(customB.schemaHash());
  });

  describe("maybe", () => {
    test("is the same for maybes of the same type", () => {
      expect(types.maybe(types.string).schemaHash()).toEqual(types.maybe(types.string).schemaHash());
      expect(types.maybe(types.string).schemaHash()).not.toEqual(types.maybe(types.number).schemaHash());
    });

    test("is the same for maybeNulls of the same type", () => {
      expect(types.maybeNull(types.string).schemaHash()).toEqual(types.maybeNull(types.string).schemaHash());
      expect(types.maybeNull(types.string).schemaHash()).not.toEqual(types.maybeNull(types.number).schemaHash());
    });

    test("is not the same for maybe and maybeNulls", () => {
      expect(types.maybe(types.string).schemaHash()).not.toEqual(types.maybeNull(types.string).schemaHash());
    });
  });

  describe("union", () => {
    test("is the same for unions of the same types", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.string,
      });

      expect(types.union(modelA, modelB).schemaHash()).toEqual(types.union(modelA, modelB).schemaHash());
      expect(types.union(modelA).schemaHash()).not.toEqual(types.union(modelA, modelB).schemaHash());
      expect(types.union(modelB).schemaHash()).not.toEqual(types.union(modelA, modelB).schemaHash());
    });

    test("is the same for unions of the different types with the same hash", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.number,
      });

      expect(types.union(modelA, modelB).schemaHash()).toEqual(types.union(modelA, modelB).schemaHash());
      expect(types.union(modelA, modelA).schemaHash()).toEqual(types.union(modelA, modelA).schemaHash());
      expect(types.union(modelA).schemaHash()).toEqual(types.union(modelB).schemaHash());
    });
  });

  describe("references", () => {
    test("is the same for the same references to the same type", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const type = types.reference(modelA);
      expect(type.schemaHash()).toEqual(type.schemaHash());
    });

    test("is the same for references to the same type", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.string,
      });

      expect(types.reference(modelA).schemaHash()).toEqual(types.reference(modelA).schemaHash());
      expect(types.reference(modelA).schemaHash()).not.toEqual(types.reference(modelB).schemaHash());
    });

    test("is not the same for references to two different types with the same hash themselves", () => {
      const modelA = types.model("ModelA", {
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model("ModelB", {
        foo: types.string,
        bar: types.number,
      });

      expect(types.reference(modelA).schemaHash()).not.toEqual(types.reference(modelB).schemaHash());
    });
  });

  describe("models", () => {
    test("is the same for models with the same properties", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.number,
      });
      expect(modelA.schemaHash()).toEqual(modelB.schemaHash());
    });

    test("is the same for models with the same nested properties", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.model({
          baz: types.number,
        }),
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.model({
          baz: types.number,
        }),
      });
      expect(modelA.schemaHash()).toEqual(modelB.schemaHash());
    });

    test("is different for models with the same properties but different types", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.boolean,
      });
      expect(modelA.schemaHash()).not.toEqual(modelB.schemaHash());
    });

    test("is different for models with different properties", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
      });
      expect(modelA.schemaHash()).not.toEqual(modelB.schemaHash());
    });

    test("is different for models with different nested properties", () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.model({
          baz: types.string,
        }),
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.model({
          baz: types.number,
        }),
      });
      expect(modelA.schemaHash()).not.toEqual(modelB.schemaHash());

      const modelC = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelD = types.model({
        foo: types.string,
        bar: types.model({
          baz: types.number,
        }),
      });
      expect(modelC.schemaHash()).not.toEqual(modelD.schemaHash());
    });
  });

  describe("class models", () => {
    test("is the same for models with the same properties", () => {
      const a = register(
        class extends ClassModel({
          foo: types.string,
          bar: types.number,
        }) {},
      );

      const b = register(
        class extends ClassModel({
          foo: types.string,
          bar: types.number,
        }) {},
      );

      expect(a.schemaHash()).toEqual(b.schemaHash());
    });

    test("is the same for models with the same nested properties", () => {
      @register
      class SubModel extends ClassModel({
        baz: types.number,
      }) {}

      const a = register(
        class extends ClassModel({
          foo: types.string,
          bar: SubModel,
        }) {},
      );

      const b = register(
        class extends ClassModel({
          foo: types.string,
          bar: SubModel,
        }) {},
      );

      expect(a.schemaHash()).toEqual(b.schemaHash());
    });

    test("is different for models with the same properties but different types", () => {
      @register
      class ModelA extends ClassModel({
        foo: types.string,
        bar: types.number,
      }) {}

      @register
      class ModelB extends ClassModel({
        foo: types.string,
        bar: types.boolean,
      }) {}
      expect(ModelA.schemaHash()).not.toEqual(ModelB.schemaHash());
    });

    test("is different for models with different properties", () => {
      @register
      class ModelA extends ClassModel({
        foo: types.string,
        bar: types.number,
      }) {}

      @register
      class ModelB extends ClassModel({
        foo: types.string,
      }) {}
      expect(ModelA.schemaHash()).not.toEqual(ModelB.schemaHash());
    });

    test("is different for models with different nested properties", () => {
      @register
      class SubModelA extends ClassModel({
        baz: types.number,
      }) {}

      @register
      class SubModelB extends ClassModel({
        baz: types.string,
      }) {}

      @register
      class ModelA extends ClassModel({
        foo: types.string,
        bar: SubModelA,
      }) {}

      @register
      class ModelB extends ClassModel({
        foo: types.string,
        bar: SubModelB,
      }) {}
      expect(ModelA.schemaHash()).not.toEqual(ModelB.schemaHash());
    });
  });

  test("can hash models with circular references", () => {
    @register
    class ModelA extends ClassModel({
      foo: types.string,
      bar: types.late((): any => ModelA),
    }) {}

    expect(ModelA.schemaHash()).toEqual(ModelA.schemaHash());
  });

  test("can hash models with mutually recursive references", () => {
    @register
    class State extends ClassModel({
      transitions: types.array(types.late((): any => Transition)),
    }) {}

    @register
    class Transition extends ClassModel({
      toState: types.reference(State),
    }) {}

    expect(State.schemaHash()).toEqual(State.schemaHash());
    expect(Transition.schemaHash()).toEqual(Transition.schemaHash());
    expect(State.schemaHash()).not.toEqual(Transition.schemaHash());
  });
});

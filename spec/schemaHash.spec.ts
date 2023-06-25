import { ClassModel, register, types } from "../src";

describe("schemaHash", () => {
  test("is the same for simple types of the same type", async () => {
    expect(await types.number.schemaHash()).toEqual(await types.number.schemaHash());
    expect(await types.number.schemaHash()).not.toEqual(await types.string.schemaHash());
  });

  test("is not the same for late types of types", async () => {
    expect(await types.late(() => types.number).schemaHash()).toEqual(await types.late(() => types.number).schemaHash());
    expect(await types.number.schemaHash()).not.toEqual(await types.late(() => types.number).schemaHash());
    expect(await types.string.schemaHash()).not.toEqual(await types.late(() => types.number).schemaHash());
  });

  test("is the same for enums with the same options", async () => {
    expect(await types.enumeration("whatever", ["foo", "bar"]).schemaHash()).toEqual(
      await types.enumeration("other", ["foo", "bar"]).schemaHash()
    );
    expect(await types.enumeration("whatever", ["foo", "bar"]).schemaHash()).not.toEqual(
      await types.enumeration("other", ["foo", "bar", "baz"]).schemaHash()
    );
  });

  test("is the same for maps of the same type", async () => {
    expect(await types.map(types.number).schemaHash()).toEqual(await types.map(types.number).schemaHash());
    expect(await types.map(types.number).schemaHash()).not.toEqual(await types.map(types.string).schemaHash());
  });

  test("is the same for arrays of the same type", async () => {
    expect(await types.array(types.number).schemaHash()).toEqual(await types.array(types.number).schemaHash());
    expect(await types.array(types.number).schemaHash()).not.toEqual(await types.array(types.string).schemaHash());
  });

  test("is the same for refinements of a same type", async () => {
    expect(await types.refinement(types.number, () => true).schemaHash()).toEqual(
      await types.refinement(types.number, () => true).schemaHash()
    );
    expect(await types.refinement(types.number, () => true).schemaHash()).not.toEqual(
      await types.refinement(types.string, () => true).schemaHash()
    );
  });

  test("is the same for all frozens", async () => {
    expect(await types.frozen().schemaHash()).toEqual(await types.frozen().schemaHash());
  });

  test("is the same the same custom type, but different for different custom types", async () => {
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

    expect(await customA.schemaHash()).toEqual(await customA.schemaHash());
    expect(await customA.schemaHash()).not.toEqual(await customB.schemaHash());
  });

  describe("maybe", () => {
    test("is the same for maybes of the same type", async () => {
      expect(await types.maybe(types.string).schemaHash()).toEqual(await types.maybe(types.string).schemaHash());
      expect(await types.maybe(types.string).schemaHash()).not.toEqual(await types.maybe(types.number).schemaHash());
    });

    test("is the same for maybeNulls of the same type", async () => {
      expect(await types.maybeNull(types.string).schemaHash()).toEqual(await types.maybeNull(types.string).schemaHash());
      expect(await types.maybeNull(types.string).schemaHash()).not.toEqual(await types.maybeNull(types.number).schemaHash());
    });

    test("is not the same for maybe and maybeNulls", async () => {
      expect(await types.maybe(types.string).schemaHash()).not.toEqual(await types.maybeNull(types.string).schemaHash());
    });
  });

  describe("union", () => {
    test("is the same for unions of the same types", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.string,
      });

      expect(await types.union(modelA, modelB).schemaHash()).toEqual(await types.union(modelA, modelB).schemaHash());
      expect(await types.union(modelA).schemaHash()).not.toEqual(await types.union(modelA, modelB).schemaHash());
      expect(await types.union(modelB).schemaHash()).not.toEqual(await types.union(modelA, modelB).schemaHash());
    });

    test("is the same for unions of the different types with the same hash", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.number,
      });

      expect(await types.union(modelA, modelB).schemaHash()).toEqual(await types.union(modelA, modelB).schemaHash());
      expect(await types.union(modelA, modelA).schemaHash()).toEqual(await types.union(modelA, modelA).schemaHash());
      expect(await types.union(modelA).schemaHash()).toEqual(await types.union(modelB).schemaHash());
    });
  });

  describe("references", () => {
    test("is the same for the same references to the same type", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const type = types.reference(modelA);
      expect(await type.schemaHash()).toEqual(await type.schemaHash());
    });

    test("is the same for references to the same type", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model({
        foo: types.string,
        bar: types.string,
      });

      expect(await types.reference(modelA).schemaHash()).toEqual(await types.reference(modelA).schemaHash());
      expect(await types.reference(modelA).schemaHash()).not.toEqual(await types.reference(modelB).schemaHash());
    });

    test("is not the same for references to two different types with the same hash themselves", async () => {
      const modelA = types.model("ModelA", {
        foo: types.string,
        bar: types.number,
      });

      const modelB = types.model("ModelB", {
        foo: types.string,
        bar: types.number,
      });

      expect(await types.reference(modelA).schemaHash()).not.toEqual(await types.reference(modelB).schemaHash());
    });
  });

  describe("models", () => {
    test("is the same for models with the same properties", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.number,
      });
      expect(await modelA.schemaHash()).toEqual(await modelB.schemaHash());
    });

    test("is the same for models with the same nested properties", async () => {
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
      expect(await modelA.schemaHash()).toEqual(await modelB.schemaHash());
    });

    test("is different for models with the same properties but different types", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
        bar: types.boolean,
      });
      expect(await modelA.schemaHash()).not.toEqual(await modelB.schemaHash());
    });

    test("is different for models with different properties", async () => {
      const modelA = types.model({
        foo: types.string,
        bar: types.number,
      });
      const modelB = types.model({
        foo: types.string,
      });
      expect(await modelA.schemaHash()).not.toEqual(await modelB.schemaHash());
    });

    test("is different for models with different nested properties", async () => {
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
      expect(await modelA.schemaHash()).not.toEqual(await modelB.schemaHash());

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
      expect(await modelC.schemaHash()).not.toEqual(await modelD.schemaHash());
    });
  });

  describe("class models", () => {
    test("is the same for models with the same properties", async () => {
      const a = register(
        class extends ClassModel({
          foo: types.string,
          bar: types.number,
        }) {}
      );

      const b = register(
        class extends ClassModel({
          foo: types.string,
          bar: types.number,
        }) {}
      );

      expect(await a.schemaHash()).toEqual(await b.schemaHash());
    });

    test("is the same for models with the same nested properties", async () => {
      @register
      class SubModel extends ClassModel({
        baz: types.number,
      }) {}

      const a = register(
        class extends ClassModel({
          foo: types.string,
          bar: SubModel,
        }) {}
      );

      const b = register(
        class extends ClassModel({
          foo: types.string,
          bar: SubModel,
        }) {}
      );

      expect(await a.schemaHash()).toEqual(await b.schemaHash());
    });

    test("is different for models with the same properties but different types", async () => {
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
      expect(await ModelA.schemaHash()).not.toEqual(await ModelB.schemaHash());
    });

    test("is different for models with different properties", async () => {
      @register
      class ModelA extends ClassModel({
        foo: types.string,
        bar: types.number,
      }) {}

      @register
      class ModelB extends ClassModel({
        foo: types.string,
      }) {}
      expect(await ModelA.schemaHash()).not.toEqual(await ModelB.schemaHash());
    });

    test("is different for models with different nested properties", async () => {
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
      expect(await ModelA.schemaHash()).not.toEqual(await ModelB.schemaHash());
    });
  });

  test("can hash models with circular references", async () => {
    @register
    class ModelA extends ClassModel({
      foo: types.string,
      bar: types.late((): any => ModelA),
    }) {}

    expect(await ModelA.schemaHash()).toEqual(await ModelA.schemaHash());
  });

  test("can hash models with mutually recursive references", async () => {
    @register
    class State extends ClassModel({
      transitions: types.array(types.late((): any => Transition)),
    }) {}

    @register
    class Transition extends ClassModel({
      toState: types.reference(State),
    }) {}

    expect(await State.schemaHash()).toEqual(await State.schemaHash());
    expect(await Transition.schemaHash()).toEqual(await Transition.schemaHash());
    expect(await State.schemaHash()).not.toEqual(await Transition.schemaHash());
  });
});

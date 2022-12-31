import type { Has, IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { IAnyClassModelType, IAnyType, Instance, IStateTreeNode, ModelPropertiesDeclaration, SnapshotIn } from "../src";
import { types } from "../src";
import { action, ClassModel, register, view } from "../src/class-model";
import { $identifier } from "../src/symbols";
import { NamedThingClass, TestClassModel } from "./fixtures/TestClassModel";
import { NamedThing, TestModelSnapshot } from "./fixtures/TestModel";

@register
class NameExample extends ClassModel({ key: types.identifier, name: types.string }) {
  @action
  setName(newName: string) {
    this.name = newName;
    return true;
  }

  @view
  slug() {
    return this.name.toLowerCase().replace(/ /g, "-");
  }

  get nameLength() {
    return this.name.length;
  }

  @view
  get decoratedNameLength() {
    return this.name.length;
  }
}

@register
class AutoIdentified extends ClassModel({ key: types.optional(types.identifier, () => "test") }) {
  @view
  testKeyIsAlwaysSet() {
    assert<IsExact<typeof this.key, string>>(true);
  }
}

@register
class ParentOfMQT extends ClassModel({ key: types.identifier, thing: NamedThing }) { }

const ParentOfModelClass = types.model("ParentOfModelClass", {
  key: types.identifier,
  child: NameExample,
});

const MapOfModelClass = types.model("MapOfModelClass", {
  key: types.identifier,
  children: types.map(NameExample),
});

const ArrayOfModelClass = types.model("ArrayOfModelClass", {
  key: types.identifier,
  children: types.array(NameExample),
});

describe("class models", () => {
  describe.each([
    ["read-only", true],
    ["observable", false],
  ])("%s", (_name, readOnly) => {
    let record: NameExample;
    beforeEach(() => {
      record = new NameExample({ key: "1", name: "Test" }, undefined, true);
    });
    it("should allow instantiating a new object", () => {
      expect(record.name).toEqual("Test");
    });

    it("separate instances should be independent", () => {
      const newRecord = new NameExample({ key: "2", name: "Test 2" }, undefined, true);
      expect(newRecord.name).toEqual("Test 2");
      expect(record.name).toEqual("Test");
    });

    it("should execute function views", () => {
      expect(record.slug()).toEqual("test");
    });

    it("should execute getter views", () => {
      expect(record.nameLength).toEqual(4);
    });

    it("should execute decorated getter views", () => {
      expect(record.decoratedNameLength).toEqual(4);
    });

    it("can create an instance with an optional identifier prop", () => {
      const auto = new AutoIdentified(undefined, undefined, readOnly);
      expect(auto.key).toEqual("test");

      const passed = new AutoIdentified({ key: "passed" }, undefined, readOnly);
      expect(passed.key).toEqual("passed");
    });

    describe("interop", () => {
      test("it can create an instance of a model class owning an MQT node from a snapshot", () => {
        const instance = new ParentOfMQT(
          {
            key: "1",
            thing: {
              key: "child",
              name: "hello",
            },
          },
          undefined,
          readOnly
        );

        expect(instance.key).toEqual("1");
        expect(instance.thing.key).toEqual("child");
        expect(instance.thing.name).toEqual("hello");
      });

      test("it can create an instance of an MQT node owning a model class from a snapshot", () => {
        const snapshot = {
          key: "1",
          child: {
            key: "child",
            name: "hello",
          },
        };
        let instance;
        if (readOnly) {
          instance = ParentOfModelClass.createReadOnly(snapshot);
        } else {
          instance = ParentOfModelClass.create(snapshot);
        }

        expect(instance.key).toEqual("1");
        expect(instance.child.key).toEqual("child");
        expect(instance.child.name).toEqual("hello");
      });

      test("it can create an instance of an MQT node owning a map of model classes from a snapshot", () => {
        const snapshot = {
          key: "1",
          children: {
            a: {
              key: "a",
              name: "hello",
            },
            b: {
              key: "b",
              name: "goodbye",
            },
          },
        };

        let instance;
        if (readOnly) {
          instance = MapOfModelClass.createReadOnly(snapshot);
        } else {
          instance = MapOfModelClass.create(snapshot);
        }

        expect(instance.key).toEqual("1");
        expect(instance.children.get("a")!.key).toEqual("a");
        expect(instance.children.get("b")!.key).toEqual("b");
      });

      test("it can create an instance of an MQT node owning an array of model classes from a snapshot", () => {
        const snapshot = {
          key: "1",
          children: [
            {
              key: "a",
              name: "hello",
            },
            {
              key: "b",
              name: "goodbye",
            },
          ],
        };

        let instance;
        if (readOnly) {
          instance = ArrayOfModelClass.createReadOnly(snapshot);
        } else {
          instance = ArrayOfModelClass.create(snapshot);
        }

        expect(instance.key).toEqual("1");
        expect(instance.children[0].key).toEqual("a");
        expect(instance.children[1].key).toEqual("b");
      });
    });
  });

  describe("read only only behaviour", () => {
    let record: NameExample;
    beforeEach(() => {
      record = new NameExample({ key: "1", name: "Test" }, undefined, true);
    });

    test("running actions should throw because the instance is readonly", () => {
      expect(record.name).toEqual("Test");
      expect(() => record.setName("Test 2")).toThrowErrorMatchingInlineSnapshot(`"Can't run action "setName" for a readonly instance"`);
    });

    it("can create an instance with an optional identifier at the $identifier private prop", () => {
      @register
      class AutoIdentified extends ClassModel({ key: types.optional(types.identifier, () => "test") }) { }

      const auto = new AutoIdentified(undefined, undefined, true);
      expect((auto as any)[$identifier]).toEqual("test");

      const passed = new AutoIdentified({ key: "passed" }, undefined, true);
      expect((passed as any)[$identifier]).toEqual("passed");
    });

    test("creating an instance with just a snapshot typechecks", () => {
      new NameExample({ key: "1", name: "Test" });
      new TestClassModel(TestModelSnapshot);
    });
  });

  describe("observable only behaviour", () => {
    let record: NameExample;
    beforeEach(() => {
      record = new NameExample({ key: "1", name: "Test" }, undefined, false);
    });

    it("should allow executing actions", () => {
      expect(record.name).toEqual("Test");

      const actionResult = record.setName("New Name");
      expect(actionResult).toBe(true);

      expect(record.name).toEqual("New Name");
    });

    it("separate instances should be independent", () => {
      expect(record.name).toEqual("Test");
      const newRecord = new NameExample({ key: "2", name: "Test 2" });
      expect(newRecord).not.toBe(record);
      expect(newRecord.name).toEqual("Test 2");
      expect(record.name).toEqual("Test");

      newRecord.setName("Test 3");
      expect(record.name).toEqual("Test");
      expect(newRecord.name).toEqual("Test 3");

      record.setName("Test 4");
      expect(record.name).toEqual("Test 4");
      expect(newRecord.name).toEqual("Test 3");

      const newNewRecord = new NameExample({ key: "3", name: "Test 4" });
      expect(newNewRecord).not.toBe(record);
      expect(newNewRecord.name).toEqual("Test 4");
      expect(record.name).toEqual("Test 4");

      newNewRecord.setName("Test 5");
      expect(newNewRecord.name).toEqual("Test 5");
      expect(record.name).toEqual("Test 4");
    });

    it("should re-execute function views", () => {
      expect(record.slug()).toEqual("test");
      record.setName("New Name");
      expect(record.slug()).toEqual("new-name");
    });

    it("should re-execute decorated getter views", () => {
      expect(record.decoratedNameLength).toEqual(4);
      record.setName("New Name");
      expect(record.decoratedNameLength).toEqual(8);
    });
  });

  test("class model classes are IClassModelType", () => {
    const _testA: IAnyType = NameExample;
    const _testB: IAnyType = NamedThingClass;
    const _testC: IAnyType = TestClassModel;
  });

  test("class model classes are IAnyTypes", () => {
    const _testA: IAnyType = NameExample;
    const _testB: IAnyType = NamedThingClass;
    const _testC: IAnyType = TestClassModel;
  });

  test("class model records have typed properties for their props", () => {
    assert<
      Has<
        TestClassModel,
        {
          bool: boolean;
          optional: string;
          frozen: { test: "string" };
          notBool: boolean;
        }
      >
    >(true);
  });

  test("class model records keep typed properties for their views and actions", () => {
    assert<
      Has<
        TestClassModel,
        {
          arrayLength: number;
          setB(v: boolean): void;
        }
      >
    >(true);
  });

  test("nested class model records have typed properties for their props", () => {
    const record = new TestClassModel(TestModelSnapshot);
    assert<
      Has<
        typeof record.nested,
        {
          key: string;
          name: string;
        }
      >
    >(true);
  });

  test("nested class model records keep typed properties for their views and actions", () => {
    const record = new TestClassModel(TestModelSnapshot);
    record.nested.lowerCasedName();
    assert<
      Has<
        typeof record.nested,
        {
          lowerCasedName(): string;
          upperCasedName(): string;
        }
      >
    >(true);
  });

  test("Instance type helper from MST returns just plain ole the class model type", () => {
    const record = new NameExample({ key: "1", name: "Test" });
    assert<IsExact<Instance<NameExample>, typeof record>>(true);
  });

  test("class model classes are IAnyClassModelType", () => {
    const _type: IAnyClassModelType = TestClassModel;
  });

  test("class model classes are IAnyType", () => {
    const _type: IAnyType = TestClassModel;
  });

  test("class model classes extend IAnyType", () => {
    assert<typeof TestClassModel extends IAnyType ? true : false>(true);
  });

  test("class model instances are IStateTreeNodes", () => {
    const _record: IStateTreeNode<IAnyType> = new NameExample({ key: "1", name: "Test" });
  });

  test("SnapshotIn type doesn't require optional properties", () => {
    const _snapshot: SnapshotIn<typeof TestClassModel> = {
      bool: true,
      frozen: { test: "string" },
      nested: { key: "a", name: "Apple" },
    };
  });

  test("SnapshotIn type accepts JSON form of complex properties", () => {
    const _snapshot: SnapshotIn<typeof TestClassModel> = {
      bool: true,
      frozen: { test: "string" },
      nested: { key: "a", name: "Apple" },
      map: {
        b: { key: "b", name: "Banana" },
        c: { key: "c", name: "Cherry" },
      },
      array: [{ key: "d", name: "Durian" }],
    };
  });

  test("it can be used within a wrapping class factory", () => {
    const identifiedClass = <P extends ModelPropertiesDeclaration = {}>(props: P) => {
      return ClassModel({
        key: types.identifier,
        ...props,
      });
    };

    @register
    class Example extends identifiedClass({ name: types.string, number: types.number }) { }

    const record = new Example({ key: "1", name: "Test", number: 10 });
    expect(record.key).toEqual("1");
    expect(record.name).toEqual("Test");
    expect(record.number).toEqual(10);
    assert<IsExact<typeof record.key, string>>(true);
    assert<IsExact<typeof record.name, string>>(true);
    assert<IsExact<typeof record.number, number>>(true);
  });

  test("unregistered types throw an error when being used in maps", () => {
    class Unregistered extends ClassModel({ name: types.string }) { }

    expect(() => {
      types.map(Unregistered)
    }).toThrow(/requires registration but has not been registered yet/)
  });

  test("unregistered types throw an error when being used in model properties", () => {
    class Unregistered extends ClassModel({ name: types.string }) { }

    expect(() => {
      types.model({
        prop: Unregistered
      })
    }).toThrow(/requires registration but has not been registered yet/)
  });

  test("unextended class models count as unregistered", () => {
    const Unregistered = ClassModel({ name: types.string });

    expect(() => {
      types.map(Unregistered)
    }).toThrow(/requires registration but has not been registered yet/)
  });
});

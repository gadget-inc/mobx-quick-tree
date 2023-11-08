import type { Has, IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import { isType as mstIsType } from "mobx-state-tree";
import type {
  Constructor,
  IAnyClassModelType,
  IAnyType,
  IClassModelType,
  ISimpleType,
  IStateTreeNode,
  Instance,
  ModelPropertiesDeclaration,
  SnapshotIn,
} from "../src";
import { flow, getSnapshot, getType, isReadOnlyNode, isStateTreeNode, isType, types } from "../src";
import { ClassModel, action, extend, register, view, volatile, volatileAction } from "../src/class-model";
import { $identifier } from "../src/symbols";
import { NameExample } from "./fixtures/NameExample";
import { NamedThingClass, TestClassModel } from "./fixtures/TestClassModel";
import { NamedThing, TestModelSnapshot } from "./fixtures/TestModel";
import { create } from "./helpers";

const DynamicNameExample = register(
  class extends ClassModel({ key: types.identifier, name: types.string }) {
    setName(newName: string) {
      this.name = newName;
      return true;
    }

    slug() {
      return this.name.toLowerCase().replace(/ /g, "-");
    }

    setNameAsync = flow(function* (this: NameExample, newName: string) {
      yield Promise.resolve();
      this.name = newName;
      return true;
    });

    get nameLength() {
      return this.name.length;
    }

    volatileProp!: string;

    setVolatileProp(newProp: string) {
      this.volatileProp = newProp;
      return true;
    }

    setVolatilePropOnReadonly(newProp: string) {
      this.volatileProp = newProp;
      return true;
    }
  },
  {
    setName: action,
    setNameAsync: action,
    volatileProp: volatile(() => "test"),
    setVolatileProp: action,
    setVolatilePropOnReadonly: volatileAction,
  },
  "NameExample"
);

/**
 * Example class to subclass a parent model class with normal `class x extends y` syntax
 */
@register
class NameExampleSubclass extends NameExample {
  @view
  get extendedNameLength() {
    return this.name.length;
  }
}

/**
 * Example mixin (class decorator)
 */
const classModelMixin = <T extends IAnyClassModelType>(Klass: T) => {
  class MixedIn extends Klass {
    get mixinView() {
      return "hello";
    }
    @action
    mixinAction(_value: string) {
      // empty
    }
  }

  return MixedIn;
};

@register
class MixedInNameExample extends classModelMixin(NameExample) {}

/**
 * Example class that subclasses a parent model class while adding additional properties
 */
@register
class ExtendedNameExample extends NameExample.extend({ extraProp: types.maybeNull(types.string) }) {
  get extendedNameLength() {
    return this.name.length;
  }

  get extraPropLength() {
    return this.extraProp?.length;
  }
}

/**
 * Example mixin that adds properties to the incoming class
 */
const extendingClassModelMixin = <T extends Constructor<{ name: string }>>(Klass: T) => {
  class MixedIn extends extend(Klass, { otherProp: types.maybeNull(types.string) }) {
    get mixinView() {
      return "hello";
    }
    @action
    mixinAction(_value: string) {
      // empty
    }
    get mixedInNameLength() {
      return this.name.length;
    }
  }

  return MixedIn;
};

@register
class ExtendedMixedInNameExample extends extendingClassModelMixin(NameExample) {
  get subclassView() {
    return new Date();
  }
}

@register
class AutoIdentified extends ClassModel({ key: types.optional(types.identifier, () => "test") }) {
  testKeyIsAlwaysSet() {
    assert<IsExact<typeof this.key, string>>(true);
  }
}

@register
class ParentOfMQT extends ClassModel({ key: types.identifier, thing: NamedThing }) {}

@register
class NestedComplex extends ClassModel({ stringArray: types.array(types.string), numberMap: types.map(types.number) }) {}

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
    ["statically defined class model", NameExample],
    ["dynamically defined class model", DynamicNameExample],
    ["subclassed class model", NameExampleSubclass],
    ["mixin'd class model", MixedInNameExample],
    ["extended props class model", ExtendedNameExample],
    ["extended mixin'd props class model", ExtendedMixedInNameExample],
  ])("%s", (_name, NameExample) => {
    test("types are identified as quick types", () => {
      expect(isType(NameExample)).toBe(true);
      expect(mstIsType(NameExample)).toBe(false);
    });

    describe.each([
      ["read-only", true],
      ["observable", false],
    ])("%s", (_name, readOnly) => {
      let record: NameExample;
      beforeEach(() => {
        record = create(NameExample, { key: "1", name: "Test" }, readOnly);
      });

      it("should allow instantiating a new object", () => {
        expect(record.name).toEqual("Test");
      });

      it("separate instances should be independent", () => {
        const newRecord = create(NameExample, { key: "2", name: "Test 2" }, readOnly);
        expect(newRecord.name).toEqual("Test 2");
        expect(record.name).toEqual("Test");
      });

      it("should execute function views", () => {
        expect(record.slug()).toEqual("test");
      });

      it("should execute getter views", () => {
        expect(record.nameLength).toEqual(4);
      });

      it("should return volatile properties", () => {
        expect(record.volatileProp).toEqual("test");
      });

      it("should allow running volatile actions", () => {
        expect(record.volatileProp).toEqual("test");
        const result = record.setVolatilePropOnReadonly("new value");
        expect(result).toBe(true);
        expect(record.volatileProp).toEqual("new value");
      });

      it("can create an instance with an optional identifier prop", () => {
        const auto = create(AutoIdentified, undefined, readOnly);
        expect(auto.key).toEqual("test");

        const passed = create(AutoIdentified, { key: "passed" }, readOnly);
        expect(passed.key).toEqual("passed");
      });

      test("actions should be present on the instance (but not necessarily callable)", () => {
        expect("setName" in record).toBeTruthy();
        expect("setVolatileProp" in record).toBeTruthy();
        expect("setVolatilePropOnReadonly" in record).toBeTruthy();
      });

      test("async actions should be present on the instance (but not necessarily callable)", () => {
        expect("setNameAsync" in record).toBeTruthy();
      });

      test(".is returns true for instances of the class model", () => {
        expect(NameExample.is(record)).toBeTruthy();
        expect(TestClassModel.is(record)).toBeFalsy();
      });

      test("functions without an explicit @view decorator are available as views", () => {
        @register
        class Test extends ClassModel({ key: types.identifier }) {
          foo() {
            return this.key + "-foo";
          }
        }

        const instance = create(Test, { key: "a" }, readOnly);
        expect(instance.foo()).toEqual("a-foo");
      });

      test("functions with an explicit @view decorator are available as views", () => {
        @register
        class Test extends ClassModel({ key: types.identifier }) {
          @view
          foo() {
            return this.key + "-foo";
          }
        }

        const instance = create(Test, { key: "a" }, readOnly);
        expect(instance.foo()).toEqual("a-foo");
      });

      describe("interop", () => {
        test("it can create an instance of a model class owning an MQT node from a snapshot", () => {
          const instance = create(
            ParentOfMQT,
            {
              key: "1",
              thing: {
                key: "child",
                name: "hello",
              },
            },
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
            instance = create(ParentOfModelClass, snapshot, true);
          } else {
            instance = create(ParentOfModelClass, snapshot);
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
            instance = create(MapOfModelClass, snapshot, true);
          } else {
            instance = create(MapOfModelClass, snapshot);
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
            instance = create(ArrayOfModelClass, snapshot, true);
          } else {
            instance = create(ArrayOfModelClass, snapshot);
          }

          expect(instance.key).toEqual("1");
          expect(instance.children[0].key).toEqual("a");
          expect(instance.children[1].key).toEqual("b");
        });

        test("instances can be created of class models which use prop = syntax in the class body", () => {
          @register
          class ClassWithPropSyntax extends ClassModel({ key: types.identifier }) {
            foo = "bar";
          }

          const _instance = create(ClassWithPropSyntax, { key: "1" }, readOnly);
        });

        test("instance type's name should be correct", () => {
          const type = getType(record);
          expect(type).toBeTruthy();
          expect(type.name).toEqual(NameExample.name);
        });
      });
    });

    describe("read only only behaviour", () => {
      let record: NameExample;
      beforeEach(() => {
        record = create(NameExample, { key: "1", name: "Test" }, true);
      });

      test("running actions should throw because the instance is readonly", () => {
        expect(() => record.setName("Test 2")).toThrowErrorMatchingInlineSnapshot(`"Can't run action "setName" for a readonly instance"`);
      });

      test("running async actions should throw because the instance is readonly", async () => {
        await expect(async () => await record.setNameAsync("Test 2")).rejects.toThrowErrorMatchingInlineSnapshot(
          `"Can't run flow action for a readonly instance"`
        );
      });

      it("can create an instance with an optional identifier at the $identifier private prop", () => {
        @register
        class AutoIdentified extends ClassModel({ key: types.optional(types.identifier, () => "test") }) {}

        const auto = create(AutoIdentified, undefined, true);
        expect((auto as any)[$identifier]).toEqual("test");

        const passed = create(AutoIdentified, { key: "passed" }, true);
        expect((passed as any)[$identifier]).toEqual("passed");
      });

      test("creating an instance with just a snapshot typechecks", () => {
        create(NameExample, { key: "1", name: "Test" });
        create(TestClassModel, TestModelSnapshot);
      });
    });

    describe("observable only behaviour", () => {
      let record: NameExample;
      beforeEach(() => {
        record = create(NameExample, { key: "1", name: "Test" }, false);
      });

      it("should allow executing actions", () => {
        expect(record.name).toEqual("Test");

        const actionResult = record.setName("New Name");
        expect(actionResult).toBe(true);

        expect(record.name).toEqual("New Name");
      });

      it("should allow executing flow actions", async () => {
        expect(record.name).toEqual("Test");

        const actionResult = await record.setNameAsync("New Name");
        expect(actionResult).toBe(true);

        expect(record.name).toEqual("New Name");
      });

      it("separate instances should be independent", () => {
        expect(record.name).toEqual("Test");
        const newRecord = create(NameExample, { key: "2", name: "Test 2" });
        expect(newRecord).not.toBe(record);
        expect(newRecord.name).toEqual("Test 2");
        expect(record.name).toEqual("Test");

        newRecord.setName("Test 3");
        expect(record.name).toEqual("Test");
        expect(newRecord.name).toEqual("Test 3");

        record.setName("Test 4");
        expect(record.name).toEqual("Test 4");
        expect(newRecord.name).toEqual("Test 3");

        const newNewRecord = create(NameExample, { key: "3", name: "Test 4" });
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

      it("should re-execute getter views", () => {
        expect(record.nameLength).toEqual(4);
        record.setName("New Name");
        expect(record.nameLength).toEqual(8);
      });

      it("should allow executing volatile setters", () => {
        expect(record.volatileProp).toEqual("test");

        const actionResult = record.setVolatileProp("New prop");
        expect(actionResult).toBe(true);

        expect(record.volatileProp).toEqual("New prop");
      });
    });

    describe("read-only class static constructor functions", () => {
      test(".create() should return an observable instance", () => {
        const record = NameExample.create({ key: "1", name: "Test" });
        expect(isStateTreeNode(record)).toBe(true);
        expect(isReadOnlyNode(record)).toBe(false);

        expect(record.key).toEqual("1");
        expect("setName" in record).toBe(true);

        // assert type returned from `create` includes not just properties but actions defined on the class
        assert<Has<typeof record, { setName: (name: string) => boolean }>>(true);
      });

      test(".createReadOnly() should return a read only instance", () => {
        const record = NameExample.createReadOnly({ key: "1", name: "Test" });
        expect(isStateTreeNode(record)).toBe(true);
        expect(isReadOnlyNode(record)).toBe(true);

        expect(record.key).toEqual("1");
        expect("setName" in record).toBe(true);

        // assert type returned from `create` includes not just properties but actions defined on the class
        assert<Has<typeof record, { setName: (name: string) => boolean }>>(true);
      });
    });

    describe("class models extending other class models", () => {
      test("should allow type safe access to the child class and parent class members", () => {
        const instance = create(NameExampleSubclass, { key: "1", name: "Test" });
        expect(instance.key).toEqual("1");
        expect(instance.nameLength).toEqual(4);
        expect(instance.extendedNameLength).toEqual(4);
        assert<IsExact<number, typeof instance.nameLength>>(true);
        assert<IsExact<number, typeof instance.extendedNameLength>>(true);
      });
    });
  });

  describe("class models with array/map/complex properties", () => {
    test("should default to empty arrays/maps when createReadOnly with undefined values", () => {
      const instance = NestedComplex.createReadOnly({});
      expect(instance.stringArray.toJSON()).toEqual([]);
      expect(instance.numberMap.toJSON()).toEqual({});
    });
  });

  test("class model classes are IClassModelType", () => {
    const _testA: IClassModelType<{ key: ISimpleType<string>; name: ISimpleType<string> }> = NameExample;
    const _testB: IClassModelType<{ key: ISimpleType<string>; name: ISimpleType<string> }> = NamedThingClass;
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
    const record = create(TestClassModel, TestModelSnapshot, true);
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
    const record = create(TestClassModel, TestModelSnapshot, true);
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
    const record = create(NameExample, { key: "1", name: "Test" }, true);
    assert<IsExact<Instance<NameExample>, typeof record>>(true);
  });

  test("class model classes extend IAnyType", () => {
    assert<typeof TestClassModel extends IAnyType ? true : false>(true);
    assert<typeof NameExample extends IAnyType ? true : false>(true);
    assert<typeof DynamicNameExample extends IAnyType ? true : false>(true);
  });

  test("class model classes extend IAnyClassModelType", () => {
    assert<typeof TestClassModel extends IAnyClassModelType ? true : false>(true);
    assert<typeof NameExample extends IAnyClassModelType ? true : false>(true);
    assert<typeof DynamicNameExample extends IAnyClassModelType ? true : false>(true);

    assert<typeof NamedThing extends IAnyClassModelType ? true : false>(false);
  });

  test("class model instances are IStateTreeNodes", () => {
    const _record: IStateTreeNode<IAnyType> = create(NameExample, { key: "1", name: "Test" }, true);
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

  test("SnapshotIn type accepts JSON form of maps to other models properties", () => {
    @register
    class Child extends ClassModel({
      key: types.identifier,
      name: types.string,
    }) {
      someView() {
        return true;
      }
    }

    @register
    class Root extends ClassModel({
      children: types.map(Child),
    }) {
      someRootView() {
        return true;
      }
    }
    const _snapshot: SnapshotIn<typeof Root> = {
      children: {
        a: { key: "a", name: "Apple" },
        b: { key: "b", name: "Banana" },
      },
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
    class Example extends identifiedClass({ name: types.string, number: types.number }) {}

    const record = create(Example, { key: "1", name: "Test", number: 10 }, true);
    expect(record.key).toEqual("1");
    expect(record.name).toEqual("Test");
    expect(record.number).toEqual(10);
    assert<IsExact<typeof record.key, string>>(true);
    assert<IsExact<typeof record.name, string>>(true);
    assert<IsExact<typeof record.number, number>>(true);
  });

  test("unregistered types throw an error when being used in maps", () => {
    class Unregistered extends ClassModel({ name: types.string }) {}

    expect(() => {
      types.map(Unregistered);
    }).toThrow(/requires registration but has not been registered yet/);
  });

  test("unregistered types throw an error when being used in model properties", () => {
    class Unregistered extends ClassModel({ name: types.string }) {}

    expect(() => {
      types.model({
        prop: Unregistered,
      });
    }).toThrow(/requires registration but has not been registered yet/);
  });

  test("unextended class models count as unregistered", () => {
    const Unregistered = ClassModel({ name: types.string });

    expect(() => {
      types.map(Unregistered);
    }).toThrow(/requires registration but has not been registered yet/);
  });

  describe("registering dynamically", () => {
    const klass = class extends ClassModel({
      key: types.string,
    }) {
      foo() {
        return "bar";
      }
    };

    test("tagging non-existent views throws an error", () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        register(klass, { doesntExist: view });
      }).toThrow();
    });

    test("tagging non-existent actions throws an error", () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - this is a test
        register(klass, { doesntExist: action });
      }).toThrow();
    });

    test("set class factory example", () => {
      const buildSet = <T extends IAnyType>(type: T) => {
        const klass = class extends ClassModel({
          items: types.array(type),
        }) {
          has(item: Instance<T>) {
            return this.items.some((existing) => existing == item);
          }

          add(item: Instance<T>) {
            if (!this.has(item)) {
              this.items.push(item);
            }
          }

          remove(item: Instance<T>) {
            this.items.remove(item);
          }
        };

        return register(klass, {
          add: action,
          remove: action,
          has: view,
        });
      };

      const NumberSet = buildSet(types.number);
      const set = NumberSet.create();
      set.add(1);
      set.add(2);
      expect(set.has(1)).toBeTruthy();
      expect(set.has(3)).toBeFalsy();
    });
  });

  test("snapshots of optional class models don't trigger typescript too-deep errors", () => {
    @register
    class Child extends ClassModel({}) {}

    const ChildSnapshot: SnapshotIn<typeof Child> = {};

    // export const DefaultNominalServerContract = ServerContract;
    const DefaultedChild = types.optional(Child, ChildSnapshot);

    @register
    class Parent extends ClassModel({
      child: DefaultedChild,
    }) {}

    const parent = Parent.create();

    const _snapshot = getSnapshot(parent);
    const _childSnapshot = getSnapshot(parent.child);
  });

  describe("view memoization", () => {
    test("class model getter views should be memoized", () => {
      let callCount = 0;
      @register
      class HasGetter extends ClassModel({
        key: types.string,
      }) {
        get upcasedKey() {
          callCount += 1;
          return this.key.toUpperCase();
        }
      }

      const instance = create(HasGetter, { key: "a" }, true);
      expect(instance.upcasedKey).toEqual("A");
      expect(callCount).toEqual(1);
      expect(instance.upcasedKey).toEqual("A");
      // getter not called again
      expect(callCount).toEqual(1);
    });

    test("class model getter views that return undefined should be memoized", () => {
      let callCount = 0;
      @register
      class HasGetter extends ClassModel({
        key: types.string,
      }) {
        get whatever() {
          callCount += 1;
          return undefined;
        }
      }

      const instance = create(HasGetter, { key: "a" }, true);
      expect(instance.whatever).toBeUndefined();
      expect(callCount).toEqual(1);
      expect(instance.whatever).toBeUndefined();
      // getter not called again
      expect(callCount).toEqual(1);
    });
  });
});

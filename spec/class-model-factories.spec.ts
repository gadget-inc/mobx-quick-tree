import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { IAnyType, IClassModelType, Instance, SnapshotIn, SnapshotOrInstance } from "../src";
import { types } from "../src";
import { ClassModel, action, register } from "../src/class-model";
import { NamedThingClass } from "./fixtures/TestClassModel";
import { create } from "./helpers";

@register
class Referrable extends ClassModel({
  key: types.identifier,
  count: types.number,
}) {
  someView() {
    return true;
  }
}

describe("class model factories", () => {
  const arrayFactory = <T extends IAnyType>(type: T) => {
    @register
    class ArrayWrapper extends ClassModel({
      items: types.array(type),
    }) {
      getItems() {
        return this.items;
      }
      @action
      replace(newItems: Instance<T>[]) {
        this.items.replace(newItems);
      }
      @action
      append(newItem: SnapshotOrInstance<T>): Instance<T> {
        this.items.push(newItem);
        return this.items[this.items.length - 1];
      }
    }
    return ArrayWrapper;
  };

  const StringArray = arrayFactory(types.string);
  const ClassModelArray = arrayFactory(NamedThingClass);

  test("can create observable instances of a factory produced class model wrapping a scalar", () => {
    const stringsInstance = StringArray.create({ items: ["a", "b", "c"] });
    expect(stringsInstance.getItems()).toEqual(["a", "b", "c"]);
    stringsInstance.replace(["d", "e", "f"]);
    expect(stringsInstance.getItems()).toEqual(["d", "e", "f"]);
  });

  test("can create readonly instances of a factory produced class model wrapping a scalar", () => {
    const stringsInstance = StringArray.createReadOnly({ items: ["a", "b", "c"] });
    expect(stringsInstance.getItems()).toEqual(["a", "b", "c"]);
  });

  test("can create observable instances of a factory produced class model wrapping a class model", () => {
    const modelsInstance = ClassModelArray.create({
      items: [
        { key: "a", name: "Apple" },
        { key: "b", name: "Banana" },
      ],
    });
    expect(modelsInstance.getItems()).toHaveLength(2);
    expect(modelsInstance.getItems()[0].key).toEqual("a");
    expect(modelsInstance.getItems()[1].key).toEqual("b");

    modelsInstance.replace([NamedThingClass.create({ key: "d", name: "Durian" })]);
    expect(modelsInstance.getItems()).toHaveLength(1);
  });

  test("can create readonly instances of a factory produced class model wrapping a class model", () => {
    const modelsInstance = ClassModelArray.createReadOnly({
      items: [
        { key: "a", name: "Apple" },
        { key: "b", name: "Banana" },
      ],
    });
    expect(modelsInstance.getItems()).toHaveLength(2);
    expect(modelsInstance.getItems()[0].key).toEqual("a");
    expect(modelsInstance.getItems()[1].key).toEqual("b");
  });

  test("functions can return instances of the generic type", () => {
    const modelsInstance = ClassModelArray.create({
      items: [
        { key: "a", name: "Apple" },
        { key: "b", name: "Banana" },
      ],
    });

    const child = modelsInstance.append({ key: "c", name: "Cherry" });
    assert<IsExact<typeof child, Instance<typeof NamedThingClass>>>(true);
    expect(child.key).toEqual("c");
    expect(child.lowerCasedName()).toEqual("cherry");
  });

  test("SnapshotIn type accepts JSON form of maps to other models properties", () => {
    const _snapshot: SnapshotIn<typeof ClassModelArray> = {
      items: [
        { key: "a", name: "Apple" },
        { key: "b", name: "Banana" },
      ],
    };
  });

  describe("with references", () => {
    const factory = <T extends IClassModelType<any, any, any>>(type: T) => {
      @register
      class ReferenceFactory extends ClassModel({
        someGenericReference: types.reference(type),
      }) {
        getReference() {
          return this.someGenericReference;
        }

        @action
        setReference(ref: Instance<T>) {
          this.someGenericReference = ref;
        }
      }

      return ReferenceFactory;
    };

    const Example = factory(Referrable);

    @register
    class FactoryRoot extends ClassModel({
      example: Example,
      refs: types.array(Referrable),
    }) {}

    test("can create instances of a factory produced class model", () => {
      const root = create(
        FactoryRoot,
        {
          example: {
            someGenericReference: "item-a",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        false
      );

      const instance = root.example;
      assert<IsExact<typeof instance, Instance<typeof Example>>>(true);

      expect(instance.someGenericReference.key).toEqual("item-a");
      expect(instance.someGenericReference.someView).toBeTruthy();
      expect(instance.getReference().key).toEqual("item-a");
      expect(instance.getReference().someView).toBeTruthy();

      const otherReferrable = root.refs[1];
      instance.setReference(otherReferrable);
    });
  });
});

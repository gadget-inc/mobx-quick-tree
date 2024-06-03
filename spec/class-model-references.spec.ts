import { read } from "fs";
import type { IAnyClassModelType, InstanceWithoutSTNTypeForType, IReferenceType, StateTreeNode } from "../src";
import { Instance, types } from "../src";
import { action, ClassModel, register } from "../src/class-model";
import { Apple } from "./fixtures/FruitAisle";
import { NameExample } from "./fixtures/NameExample";
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

@register
class Referencer extends ClassModel({
  ref: types.reference(Referrable),
  safeRef: types.safeReference(Referrable),
}) {
  @action
  setRef(ref: Referrable) {
    // Just here for typechecking
    this.ref = ref;
  }

  @action
  setRefInstance(ref: Instance<Referrable>) {
    // Just here for typechecking
    this.ref = ref;
  }
}

@register
class Root extends ClassModel({
  model: Referencer,
  refs: types.array(Referrable),
}) {}

describe("class model references", () => {
  describe.each([
    ["read-only", true],
    ["observable", false],
  ])("%s", (_name, readOnly) => {
    test("can resolve valid references", () => {
      const root = create(
        Root,
        {
          model: {
            ref: "item-a",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        readOnly,
      );

      expect(root.model.ref).toEqual(
        expect.objectContaining({
          key: "item-a",
          count: 12,
        }),
      );
    });

    test("throws for invalid refs", () => {
      const createRoot = () => {
        const instance = create(
          Root,
          {
            model: {
              ref: "item-c",
            },
            refs: [
              { key: "item-a", count: 12 },
              { key: "item-b", count: 523 },
            ],
          },
          readOnly,
        );
        instance.model.ref;
      };

      expect(createRoot).toThrow();
    });

    test("can resolve valid safe references", () => {
      const root = create(
        Root,
        {
          model: {
            ref: "item-a",
            safeRef: "item-b",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        readOnly,
      );

      expect(root.model.safeRef).toEqual(
        expect.objectContaining({
          key: "item-b",
          count: 523,
        }),
      );
    });

    test("does not throw for invalid safe references", () => {
      const root = create(
        Root,
        {
          model: {
            ref: "item-a",
            safeRef: "item-c",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        readOnly,
      );

      expect(root.model.safeRef).toBeUndefined();
    });

    test("references are equal to the instances they refer to", () => {
      const root = create(
        Root,
        {
          model: {
            ref: "item-a",
            safeRef: "item-b",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        readOnly,
      );

      expect(root.model.ref).toBe(root.refs[0]);
      expect(root.model.ref).toEqual(root.refs[0]);
      expect(root.model.ref).toStrictEqual(root.refs[0]);
    });

    test("safe references are equal to the instances they refer to", () => {
      const root = create(
        Root,
        {
          model: {
            ref: "item-a",
            safeRef: "item-b",
          },
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
        },
        readOnly,
      );

      expect(root.model.safeRef).toBe(root.refs[1]);
      expect(root.model.safeRef).toEqual(root.refs[1]);
      expect(root.model.safeRef).toStrictEqual(root.refs[1]);
    });

    @register
    class Weird extends ClassModel({
      examples: types.map(NameExample),
      obj: types.union(types.reference(NameExample), Apple),
    }) {}

    test("unions where one type is a reference can be resolved as references", () => {
      const instance = create(
        Weird,
        {
          examples: {
            foo: { key: "foo", name: "foo" },
          },
          obj: "foo",
        },
        readOnly,
      );

      expect((instance.obj as NameExample).name).toEqual("foo");
    });

    test("unions where one type is a reference can be resolved a the non-reference type", () => {
      const instance = create(
        Weird,
        {
          examples: {
            foo: { key: "foo", name: "foo" },
          },
          obj: { type: "Apple", ripeness: 1 },
        },
        readOnly,
      );

      expect((instance.obj as Apple).ripeness).toEqual(1);
    });
  });
});

describe("class model factories with generic references", () => {
  const factory = <
    T extends IAnyClassModelType,
    InstanceOfT extends StateTreeNode<InstanceWithoutSTNTypeForType<T>, IReferenceType<T>> = StateTreeNode<
      InstanceWithoutSTNTypeForType<T>,
      IReferenceType<T>
    >,
  >(
    type: T,
  ) => {
    return register(
      class extends ClassModel({
        someGenericReference: types.reference(type),
      }) {
        getReference() {
          return this.someGenericReference;
        }

        setReference(ref: InstanceOfT) {
          this.someGenericReference = ref;
        }
      },
      { setReference: action },
    );
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
      false,
    );

    const instance = root.example;
    expect(instance.someGenericReference.key).toEqual("item-a");
    expect(instance.someGenericReference.someView).toBeTruthy();
    expect(instance.getReference().key).toEqual("item-a");
    expect(instance.getReference().someView).toBeTruthy();

    const otherReferrable = root.refs[1];
    instance.setReference(otherReferrable);
  });
});

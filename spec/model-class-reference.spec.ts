import { types } from "../src";
import { action, ClassModel, register } from "../src/class-model";

@register
class Referrable extends ClassModel({
  key: types.identifier,
  count: types.number,
}) {}

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
}

@register
class Root extends ClassModel({
  model: Referencer,
  refs: types.array(Referrable),
}) {}

describe("model class references", () => {
  test("can resolve valid references", () => {
    const root = Root.createReadOnly({
      model: {
        ref: "item-a",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

    expect(root.model.ref).toEqual(
      expect.objectContaining({
        key: "item-a",
        count: 12,
      })
    );
  });

  test("throws for invalid refs", () => {
    const createRoot = () =>
      Root.createReadOnly({
        model: {
          ref: "item-c",
        },
        refs: [
          { key: "item-a", count: 12 },
          { key: "item-b", count: 523 },
        ],
      });

    expect(createRoot).toThrow();
  });

  test("can resolve valid safe references", () => {
    const root = Root.createReadOnly({
      model: {
        ref: "item-a",
        safeRef: "item-b",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

    expect(root.model.safeRef).toEqual(
      expect.objectContaining({
        key: "item-b",
        count: 523,
      })
    );
  });

  test("does not throw for invalid safe references", () => {
    const root = Root.createReadOnly({
      model: {
        ref: "item-a",
        safeRef: "item-c",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

    expect(root.model.safeRef).toBeUndefined();
  });

  test("references are equal to the instances they refer to", () => {
    const root = Root.createReadOnly({
      model: {
        ref: "item-a",
        safeRef: "item-b",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

    expect(root.model.ref).toBe(root.refs[0]);
    expect(root.model.ref).toEqual(root.refs[0]);
    expect(root.model.ref).toStrictEqual(root.refs[0]);
  });

  test("safe references are equal to the instances they refer to", () => {
    const root = Root.createReadOnly({
      model: {
        ref: "item-a",
        safeRef: "item-b",
      },
      refs: [
        { key: "item-a", count: 12 },
        { key: "item-b", count: 523 },
      ],
    });

    expect(root.model.safeRef).toBe(root.refs[1]);
    expect(root.model.safeRef).toEqual(root.refs[1]);
    expect(root.model.safeRef).toStrictEqual(root.refs[1]);
  });
});

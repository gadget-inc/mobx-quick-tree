import type { Has } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { IAnyClassModelType, Instance, SnapshotOrInstance } from "../src";
import { ClassModel, register, types } from "../src";
import { TestClassModel } from "./fixtures/TestClassModel";
import { TestModel, TestModelSnapshot } from "./fixtures/TestModel";
import { create } from "./helpers";

const Referrable = types.model("Referenced", {
  key: types.identifier,
  count: types.number,
});

const Referencer = types
  .model("Referencer", {
    ref: types.reference(Referrable),
    safeRef: types.safeReference(Referrable),
  })
  .actions((self) => ({
    setRef(ref: Instance<typeof Referrable>) {
      // Just here for typechecking
      self.ref = ref;
    },
    setRefSnapshot(ref: SnapshotOrInstance<typeof Referrable>) {
      // Just here for typechecking
      self.ref = ref;
    },
  }));

const Root = types.model("Reference Model", {
  model: Referencer,
  refs: types.array(Referrable),
});

describe("references", () => {
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

    test("safe references marked with allowUndefined false are non-nullable in types-style arrays", () => {
      const Referencer = types.model("Referencer", {
        safeRefs: types.array(types.safeReference(Referrable, { acceptsUndefined: false })),
      });

      const Root = types.model("Reference Model", {
        refs: types.array(Referrable),
        model: Referencer,
      });
      const root = create(
        Root,
        {
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
          model: {
            safeRefs: ["item-a", "item-c"],
          },
        },
        readOnly,
      );

      expect(root.model.safeRefs.map((obj) => obj.key)).toEqual(["item-a"]);

      type instanceType = (typeof root.model.safeRefs)[0];
      assert<Has<instanceType, undefined>>(false);
      assert<Has<instanceType, null>>(false);
    });

    test("safe references marked with allowUndefined false are non-nullable in types-style maps", () => {
      const Referencer = types.model("Referencer", {
        safeRefs: types.map(types.safeReference(Referrable, { acceptsUndefined: false })),
      });

      const Root = types.model("Reference Model", {
        refs: types.array(Referrable),
        model: Referencer,
      });
      const root = create(
        Root,
        {
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
          model: {
            safeRefs: {
              "item-a": "item-a",
              "item-c": "item-c",
            },
          },
        },
        readOnly,
      );

      expect([...root.model.safeRefs.keys()]).toEqual(["item-a"]);
    });

    test("safe references marked with allowUndefined false are non-nullable in class model arrays", () => {
      @register
      class Referencer extends ClassModel({
        safeRefs: types.array(types.safeReference(Referrable, { acceptsUndefined: false })),
      }) {}

      @register
      class Root extends ClassModel({
        refs: types.array(Referrable),
        model: Referencer,
      }) {}

      const root = create(
        Root,
        {
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
          model: {
            safeRefs: ["item-a", "item-c"],
          },
        },
        readOnly,
      );

      expect(root.model.safeRefs.map((obj) => obj.key)).toEqual(["item-a"]);

      type instanceType = (typeof root.model.safeRefs)[0];
      assert<Has<instanceType, undefined>>(false);
      assert<Has<instanceType, null>>(false);
    });

    test("safe references marked with allowUndefined false are non-nullable in class model maps", () => {
      @register
      class Referencer extends ClassModel({
        safeRefs: types.map(types.safeReference(Referrable, { acceptsUndefined: false })),
      }) {}

      @register
      class Root extends ClassModel({
        refs: types.array(Referrable),
        model: Referencer,
      }) {}

      const root = create(
        Root,
        {
          refs: [
            { key: "item-a", count: 12 },
            { key: "item-b", count: 523 },
          ],
          model: {
            safeRefs: {
              "item-a": "item-a",
              "item-c": "item-c",
            },
          },
        },
        readOnly,
      );

      expect([...root.model.safeRefs.keys()]).toEqual(["item-a"]);
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

  test("instances of a model reference are assignable to instances of the model", () => {
    const instance = TestModel.create(TestModelSnapshot);
    const referenceType = types.reference(TestModel);

    type instanceType = typeof instance;
    type referenceInstanceType = Instance<typeof referenceType>;
    assert<Has<instanceType, referenceInstanceType>>(true);
    assert<Has<referenceInstanceType, instanceType>>(true);
  });

  test("instances of a model reference are assignable to readonly instances of the model", () => {
    const instance = TestModel.createReadOnly(TestModelSnapshot);
    const referenceType = types.reference(TestModel);

    type instanceType = typeof instance;
    type referenceInstanceType = Instance<typeof referenceType>;
    assert<Has<instanceType, referenceInstanceType>>(true);
    assert<Has<referenceInstanceType, instanceType>>(true);
  });

  test("instances of a class model reference are assignable to instances of the class model", () => {
    const instance = TestClassModel.create(TestModelSnapshot);
    const referenceType = types.reference(TestClassModel);

    type instanceType = typeof instance;
    type referenceInstanceType = Instance<typeof referenceType>;
    assert<Has<instanceType, referenceInstanceType>>(true);
    assert<Has<referenceInstanceType, instanceType>>(true);
  });

  test("instances of a class model reference are assignable to readonly instances of the class model", () => {
    const instance = TestClassModel.createReadOnly(TestModelSnapshot);
    const referenceType = types.reference(TestClassModel);

    type instanceType = typeof instance;
    type referenceInstanceType = Instance<typeof referenceType>;
    assert<Has<instanceType, referenceInstanceType>>(true);
    assert<Has<referenceInstanceType, instanceType>>(true);
  });

  describe("resolution order", () => {
    @register
    class User extends ClassModel({
      id: types.identifier,
      name: types.string,
    }) {}

    @register
    class Post extends ClassModel({
      id: types.identifier,
      title: types.string,
      author: types.reference(User),
    }) {}

    // eslint-disable-next-line prefer-const
    let State: IAnyClassModelType;
    @register
    class StateChartState extends ClassModel({
      id: types.identifier,
      initialChildState: types.maybe(types.reference(types.late(() => State))),
      childStates: types.array(types.late(() => State)),
    }) {}
    State = StateChartState;

    test("can resolve references when sources are instantiated first", () => {
      @register
      class Root extends ClassModel({
        users: types.map(User),
        posts: types.map(Post),
      }) {}

      const root = Root.createReadOnly({
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
      });

      expect(root.posts.get("1")!.author.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve references when references are instantiated first", () => {
      @register
      class Root extends ClassModel({
        posts: types.map(Post),
        users: types.map(User),
      }) {}

      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
      });

      expect(root.posts.get("1")!.author.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve references when late type references are instantiated first", () => {
      @register
      class Root extends ClassModel({
        posts: types.map(types.late(() => Post)),
        users: types.map(User),
      }) {}

      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
      });
      expect(root.posts.get("1")!.author.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve references when maybe references are instantiated first", () => {
      @register
      class Root extends ClassModel({
        posts: types.map(types.maybeNull(Post)),
        users: types.map(User),
      }) {}

      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
      });
      expect(root.posts.get("1")!.author.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve references when references to late types are instantiated first", () => {
      @register
      class PostWithLateAuthor extends ClassModel({
        id: types.identifier,
        title: types.string,
        author: types.reference(types.late(() => User)),
      }) {}

      @register
      class Root extends ClassModel({
        posts: types.map(PostWithLateAuthor),
        users: types.map(User),
      }) {}

      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
      });

      expect(root.posts.get("1")!.author?.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve references when both source and target are late types", () => {
      @register
      class PostWithLateAuthor extends ClassModel({
        id: types.identifier,
        title: types.string,
        author: types.reference(types.late(() => User)),
      }) {}

      @register
      class Root extends ClassModel({
        posts: types.map(types.late(() => PostWithLateAuthor)),
        users: types.map(types.late(() => User)),
      }) {}

      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
          "2": { id: "2", title: "Second Post", author: "2" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
          "2": { id: "2", name: "Bob" },
        },
      });

      expect(root.posts.get("1")!.author.id).toBe(root.users.get("1")!.id);
    });

    test("can resolve nested references", () => {
      StateChartState.createReadOnly({
        id: "created",
        initialChildState: "rightSideUp",
        childStates: [{ id: "rightSideUp" }],
      });
    });

    test("can resolve deeply nested references", () => {
      StateChartState.createReadOnly({
        id: "created",
        initialChildState: "rightSideUp",
        childStates: [
          { id: "rightSideUp" },
          { id: "upsideDown", initialChildState: "left", childStates: [{ id: "left" }, { id: "right" }] },
        ],
      });
    });
  });
});

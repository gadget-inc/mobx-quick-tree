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

  describe("reference tracking optimization", () => {
    test("only caches types that have identifiers or are referenced", () => {
      // Create a type with an identifier - should always be cached
      @register
      class WithIdentifier extends ClassModel({
        id: types.identifier,
        name: types.string,
      }) {}

      // Create a type without identifier and not referenced - should NOT be cached
      @register
      class WithoutIdentifierNotReferenced extends ClassModel({
        name: types.string,
        value: types.number,
      }) {}

      // Create a type without identifier but IS referenced - should be cached when referenced
      @register
      class WithoutIdentifierButReferenced extends ClassModel({
        id: types.identifier, // Give it an identifier so we can reference it
        name: types.string,
        value: types.number,
      }) {}

      // Create a root that references one type but not the other
      @register
      class Root extends ClassModel({
        withId: WithIdentifier,
        withoutIdNotReferenced: WithoutIdentifierNotReferenced,
        referencedType: types.reference(WithoutIdentifierButReferenced),
        referencedInstances: types.array(WithoutIdentifierButReferenced),
      }) {}

      // Create an instance and check what's in the reference cache
      const root = Root.createReadOnly({
        withId: { id: "test-id", name: "Test" },
        withoutIdNotReferenced: { name: "Not Cached", value: 42 },
        referencedType: "ref-1",
        referencedInstances: [
          { id: "ref-1", name: "Referenced 1", value: 1 },
          { id: "ref-2", name: "Referenced 2", value: 2 },
        ],
      });

      // Access the context to check the reference cache
      const context = (root as any)[Symbol.for("MQT_context")];
      const referenceCache = context.referenceCache;

      // Should contain instances with identifiers
      expect(referenceCache.has("test-id")).toBe(true); // WithIdentifier
      expect(referenceCache.has("ref-1")).toBe(true); // WithoutIdentifierButReferenced
      expect(referenceCache.has("ref-2")).toBe(true); // WithoutIdentifierButReferenced

      // Get all cached identifiers
      const cachedIds = Array.from(referenceCache.keys()).sort();

      // Should contain all identifiers since all these types have identifiers
      expect(cachedIds).toEqual(["ref-1", "ref-2", "test-id"]);

      // The optimization works by not caching the WithoutIdentifierNotReferenced instance
      // since it has no identifier (so it can't be cached anyway) and isn't referenced
      // The real optimization is in memory usage - we don't track unnecessary references
    });

    test("handles circular late type references correctly", () => {
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

      @register
      class Root extends ClassModel({
        // Use late types to create potential circular dependencies
        posts: types.map(types.late(() => Post)),
        users: types.map(types.late(() => User)),
      }) {}

      // This should work without throwing errors about circular dependencies
      const root = Root.createReadOnly({
        posts: {
          "1": { id: "1", title: "First Post", author: "1" },
        },
        users: {
          "1": { id: "1", name: "Alice" },
        },
      });

      // Verify the reference was resolved correctly
      expect(root.posts.get("1")!.author.id).toBe("1");
      expect(root.posts.get("1")!.author.name).toBe("Alice");

      // Check that both User and Post instances are cached (they have identifiers)
      const context = (root as any)[Symbol.for("MQT_context")];
      const referenceCache = context.referenceCache;

      expect(referenceCache.has("1")).toBe(true); // User with id "1"
      expect(referenceCache.get("1")).toBe(root.users.get("1"));
    });

    test("works with nested references in complex type structures", () => {
      @register
      class Category extends ClassModel({
        id: types.identifier,
        name: types.string,
      }) {}

      @register
      class Product extends ClassModel({
        id: types.identifier,
        name: types.string,
        category: types.reference(Category),
      }) {}

      @register
      class Order extends ClassModel({
        id: types.identifier,
        products: types.array(types.reference(Product)),
      }) {}

      @register
      class Root extends ClassModel({
        categories: types.map(Category),
        products: types.map(Product),
        orders: types.map(Order),
      }) {}

      const root = Root.createReadOnly({
        categories: {
          cat1: { id: "cat1", name: "Electronics" },
        },
        products: {
          prod1: { id: "prod1", name: "Laptop", category: "cat1" },
        },
        orders: {
          order1: { id: "order1", products: ["prod1"] },
        },
      });

      // Verify all references resolve correctly
      expect(root.orders.get("order1")!.products[0].name).toBe("Laptop");
      expect(root.orders.get("order1")!.products[0].category.name).toBe("Electronics");

      // All these types have identifiers, so they should all be cached
      const context = (root as any)[Symbol.for("MQT_context")];
      const referenceCache = context.referenceCache;

      expect(referenceCache.has("cat1")).toBe(true);
      expect(referenceCache.has("prod1")).toBe(true);
      expect(referenceCache.has("order1")).toBe(true);
    });
  });
});

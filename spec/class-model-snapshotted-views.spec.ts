import { ClassModel, action, snapshottedView, getSnapshot, register, types } from "../src";
import { Apple } from "./fixtures/FruitAisle";
import { create } from "./helpers";

@register
class ViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
  @snapshottedView()
  get slug() {
    return this.name.toLowerCase().replace(/ /g, "-");
  }

  @action
  setName(name: string) {
    this.name = name;
  }
}

@register
class Outer extends ClassModel({ name: types.string, examples: types.array(ViewExample) }) {
  @snapshottedView()
  get upperName() {
    return this.name.toUpperCase();
  }
}

describe("class model snapshotted views", () => {
  // describe.each([
  //   ["read-only", true],
  //   ["observable", false],
  // ])("%s", (_name, readOnly) => {
  describe("whatever", () => {
    const readOnly = false;

    test("instances don't require the snapshot to include the cache", () => {
      const instance = create(ViewExample, { key: "1", name: "Test" }, readOnly);
      expect(instance.slug).toEqual("test");
    });

    test("unchanged instances return the view value in a snapshot of itself when the view is given in the input snapshot", () => {
      const instance = create(ViewExample, { key: "1", name: "Test", slug: "test" } as any, readOnly);
      const snapshot = getSnapshot(instance);
      expect((snapshot as any).slug).toEqual("test");
    });

    test("unchanged instances return the view value in a snapshot of itself when the view is not given in the input snapshot", () => {
      const instance = create(ViewExample, { key: "1", name: "Test" } as any, readOnly);
      const snapshot = getSnapshot(instance);
      expect((snapshot as any).slug).toEqual("test");
    });

    test("snapshots of nested instances returns the view value in the snapshot of itself when not given in the input snapshot", () => {
      const instance = create(Outer, { name: "Test", examples: [{ key: "1", name: "Test" }] } as any, readOnly);

      const snapshot = getSnapshot(instance);
      expect((snapshot as any).upperName).toEqual("TEST");
      expect((snapshot as any).examples[0].slug).toEqual("test");
    });

    test("models with cached views still correctly report .is on totally different models", () => {
      const instance = create(ViewExample, { key: "1", name: "Test" }, readOnly);
      expect(ViewExample.is(instance)).toBe(true);
      expect(Apple.is(instance)).toBe(false);

      const other = create(Apple, { type: "Apple", ripeness: 1 }, readOnly);
      expect(ViewExample.is(other)).toBe(false);
      expect(Apple.is(other)).toBe(true);
    });

    test("instances of models with all optional properties arent .is of other models with all optional properties", () => {
      @register
      class AllOptionalA extends ClassModel({ name: types.optional(types.string, "Jim") }) {}

      @register
      class AllOptionalB extends ClassModel({ title: types.optional(types.string, "Jest") }) {}

      // the empty snapshot matches both types
      expect(AllOptionalA.is({})).toBe(true);
      expect(AllOptionalB.is({})).toBe(true);

      const instanceA = create(AllOptionalA, {}, readOnly);
      expect(AllOptionalA.is(instanceA)).toBe(true);
      expect(AllOptionalB.is(instanceA)).toBe(false);

      const instanceB = create(AllOptionalA, {}, readOnly);
      expect(AllOptionalA.is(instanceB)).toBe(true);
      expect(AllOptionalB.is(instanceB)).toBe(false);
    });

    // blocked on https://github.com/mobxjs/mobx-state-tree/pull/2182
    // test("instances of models with all optional properties arent .is of other models with all optional properties with snapshotted views", () => {
    //   @register
    //   class AllOptionalA extends ClassModel({ name: types.optional(types.string, "Jim") }) {
    //     @snapshottedView()
    //     get slug() {
    //       return this.name.toLowerCase();
    //     }
    //   }

    //   @register
    //   class AllOptionalB extends ClassModel({ title: types.optional(types.string, "Jest") }) {
    //     @snapshottedView()
    //     get whatever() {
    //       return Math.random();
    //     }
    //   }

    //   // the empty snapshot matches both types
    //   expect(AllOptionalA.is({})).toBe(true);
    //   expect(AllOptionalB.is({})).toBe(true);

    //   const instanceA = create(AllOptionalA, {}, readOnly);
    //   expect(AllOptionalA.is(instanceA)).toBe(true);
    //   expect(AllOptionalB.is(instanceA)).toBe(false);

    //   const instanceB = create(AllOptionalA, {}, readOnly);
    //   expect(AllOptionalA.is(instanceB)).toBe(true);
    //   expect(AllOptionalB.is(instanceB)).toBe(false);
    // });
  });

  test("an observable instance saves the view value in a snapshot when changed", () => {
    const instance = ViewExample.create({ key: "1", name: "Test" });
    expect(instance.slug).toEqual("test");
    let snapshot = getSnapshot(instance);
    expect(snapshot).toEqual({ key: "1", name: "Test", slug: "test" });
    instance.setName("New Name");
    snapshot = getSnapshot(instance);
    expect(snapshot).toEqual({ key: "1", name: "New Name", slug: "new-name" });
  });

  test("an observable instance updates the saved view when the observed view value changes", () => {
    const instance = ViewExample.create({ key: "1", name: "Test" });
    instance.setName("New Name");
    expect(instance.slug).toEqual("new-name");
    const snapshot = getSnapshot(instance);
    expect(snapshot).toEqual({ key: "1", name: "New Name", slug: "new-name" });
  });

  test("an observable instance ignores the input snapshot value as the logic may have changed", () => {
    const instance = ViewExample.create({ key: "1", name: "Test", slug: "outdated-cache" } as any);
    expect(instance.slug).toEqual("test");
  });

  test("a readonly instance returns the view value from the snapshot if present", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test", slug: "test" } as any);
    expect(instance.slug).toEqual("test");
  });

  test("a readonly instance doesn't recompute the view value from the snapshot", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test", slug: "whatever" } as any);
    expect(instance.slug).toEqual("whatever");
  });

  test("a readonly instance doesn't call the computed function if given a snapshot value", () => {
    const fn = jest.fn();
    @register
    class Spy extends ClassModel({ name: types.string }) {
      @snapshottedView()
      get slug() {
        fn();
        return this.name.toLowerCase().replace(/ /g, "-");
      }
    }

    const instance = Spy.createReadOnly({ name: "Test", slug: "whatever" } as any);
    expect(instance.slug).toEqual("whatever");
    expect(fn).not.toHaveBeenCalled();
  });

  test("an observable instance call the computed function on construction if not given a value", () => {
    const fn = jest.fn();
    @register
    class Spy extends ClassModel({ name: types.string }) {
      @snapshottedView()
      get slug() {
        fn();
        return this.name.toLowerCase().replace(/ /g, "-");
      }
      @action
      setName(name: string) {
        this.name = name;
      }
    }

    const instance = Spy.create({ name: "Test" });
    expect(fn).toHaveBeenCalledTimes(1);

    // not called again upon snapshotting
    getSnapshot(instance);
    expect(fn).toHaveBeenCalledTimes(1);

    instance.setName("New Name");
    expect(fn).toHaveBeenCalled();
  });

  test("snapshotted views can be passed nested within snapshots", () => {
    const instance = Outer.createReadOnly({
      name: "foo",
      upperName: "SNAPSHOT",
      examples: [{ key: "1", name: "Test", slug: "test-foobar" } as any, { key: "2", name: "Test 2", slug: "test-qux" } as any],
    } as any);

    expect(instance.upperName).toEqual("SNAPSHOT");
    expect(instance.examples[0].slug).toEqual("test-foobar");
    expect(instance.examples[1].slug).toEqual("test-qux");
  });

  describe("with a hydrator", () => {
    @register
    class HydrateExample extends ClassModel({ url: types.string }) {
      @snapshottedView<URL>({
        getSnapshot(value, snapshot, node) {
          expect(snapshot).toBeDefined();
          expect(node).toBeDefined();
          return value.toString();
        },
        createReadOnly(value, snapshot, node) {
          expect(snapshot).toBeDefined();
          expect(node).toBeDefined();
          return value ? new URL(value) : undefined;
        },
      })
      get withoutParams() {
        const url = new URL(this.url);
        for (const [key] of url.searchParams.entries()) {
          url.searchParams.delete(key);
        }
        return url;
      }

      @action
      setURL(url: string) {
        this.url = url;
      }
    }

    test("snapshotted views with processors can be accessed on observable instances", () => {
      const instance = HydrateExample.create({ url: "https://gadget.dev/blog/feature?utm=whatever" });
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature"));
    });

    test("snapshotted views with processors can be accessed on readonly instances when there's no input data", () => {
      const instance = HydrateExample.create({ url: "https://gadget.dev/blog/feature?utm=whatever" });
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature"));
    });

    test("snapshotted views with processors can be accessed on readonly instances when there is input data", () => {
      const instance = HydrateExample.createReadOnly({
        url: "https://gadget.dev/blog/feature?utm=whatever",
        withoutParams: "https://gadget.dev/blog/feature/extra", // pass a different value so we can be sure it is what is being used
      } as any);
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature/extra"));
    });
  });

  describe("references", () => {
    @register
    class Referencer extends ClassModel({
      id: types.identifier,
      example: types.reference(ViewExample),
    }) {}

    @register
    class Root extends ClassModel({
      referrers: types.map(Referencer),
      examples: types.map(ViewExample),
    }) {}

    test("references to models with snapshotted views can be instantiated", () => {
      const root = Root.createReadOnly({
        referrers: {
          a: { id: "a", example: "1" },
          b: { id: "b", example: "2" },
        },
        examples: {
          "1": { key: "1", name: "Alice" },
          "2": { key: "2", name: "Bob" },
        },
      });

      expect(getSnapshot(root)).toMatchSnapshot();
    });
  });
});

import { observable, runInAction } from "mobx";
import { ClassModel, action, snapshottedView, getSnapshot, register, types, onPatch } from "../src";
import { Apple } from "./fixtures/FruitAisle";
import { create } from "./helpers";
import { getParent } from "mobx-state-tree";
import { setDefaultShouldEmitPatchOnChange } from "../src/class-model";

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
  describe.each([
    ["read-only", true],
    ["observable", false],
  ])("%s", (_name, readOnly) => {
    test("instances don't require the snapshot to include the cache", () => {
      const instance = create(ViewExample, { key: "1", name: "Test" }, readOnly);
      expect(instance.slug).toEqual("test");
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
  });

  test("an observable instance ignores the input snapshot value as the logic may have changed", () => {
    const instance = ViewExample.create({ key: "1", name: "Test", slug: "outdated-cache" } as any);
    expect(instance.slug).toEqual("test");
  });

  test("an observable instance's snapshot includes the snapshotted views epoch", () => {
    const instance = ViewExample.create({ key: "1", name: "Test" });
    expect(getSnapshot(instance)).toEqual({ __snapshottedViewsEpoch: 0, key: "1", name: "Test" });
  });

  test("a readonly instance's snapshot doesn't include the snapshotted views epoch", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test" });
    expect(getSnapshot(instance)).toEqual({ key: "1", name: "Test" });
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
        createReadOnly(value, node) {
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

    test("hydrators aren't called eagerly on readonly instances in case they are expensive", () => {
      const fn = jest.fn().mockReturnValue("whatever");
      @register
      class HydrateExampleSpy extends ClassModel({}) {
        @snapshottedView<URL>({
          createReadOnly: fn,
        })
        get someView() {
          return "view value";
        }
      }

      const instance = HydrateExampleSpy.createReadOnly({ someView: "snapshot value" });
      expect(fn).not.toHaveBeenCalled();

      expect(instance.someView).toEqual("whatever");
      expect(fn).toHaveBeenCalledTimes(1);
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

  describe("parents", () => {
    const onError = jest.fn();

    @register
    class Child extends ClassModel({}) {
      @snapshottedView({ onError, shouldEmitPatchOnChange: () => true })
      get parentsChildLength() {
        const parent: Parent = getParent(this, 2);
        return parent.children.size;
      }
    }

    @register
    class Parent extends ClassModel({ children: types.map(Child) }) {
      @action
      setChild(key: string, child: Child) {
        this.children.set(key, child);
      }

      @action
      createChild(key: string) {
        this.children.set(key, {});
        return this.children.get(key);
      }

      @action
      removeChild(key: string) {
        this.children.delete(key);
      }
    }

    test("observable instances with views that access their parent will cause their view's reaction to error when created outside an action", () => {
      Child.create();
      expect(onError).toHaveBeenCalled();
    });

    test("observable instances with views that access their parent will not cause their view's reaction to error when created inside an action", () => {
      runInAction(() => {
        const child = Child.create();
        const parent = Parent.create();
        parent.setChild("foo", child);
      });

      expect(onError).not.toHaveBeenCalled();
    });

    test("observable instances don't run their view's reaction when they are destroyed", () => {
      const parent = Parent.create();
      parent.createChild("foo");
      parent.removeChild("foo");

      // would have errored if child.parentsChildLength was accessed after the child was removed
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("shouldEmitPatchOnChange", () => {
    afterEach(() => {
      // reset the default value
      setDefaultShouldEmitPatchOnChange(false);
    });

    test("readonly instances don't use the shouldEmitPatchOnChange option", () => {
      const fn = jest.fn();
      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView({ shouldEmitPatchOnChange: fn })
        get slug() {
          return this.name.toLowerCase().replace(/ /g, "-");
        }
      }

      const instance = MyViewExample.createReadOnly({ key: "1", name: "Test" });
      expect(instance.slug).toEqual("test");
      expect(fn).not.toHaveBeenCalled();
    });

    test("observable instances don't emit a patch when shouldEmitPatchOnChange returns false", () => {
      const shouldEmitPatchOnChangeFn = jest.fn(() => false);
      const observableArray = observable.array<string>([]);

      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView({ shouldEmitPatchOnChange: shouldEmitPatchOnChangeFn })
        get arrayLength() {
          return observableArray.length;
        }
      }

      const instance = MyViewExample.create({ key: "1", name: "Test" });
      expect(shouldEmitPatchOnChangeFn).toHaveBeenCalled();

      const onPatchFn = jest.fn();
      onPatch(instance, onPatchFn);

      runInAction(() => {
        observableArray.push("a");
      });

      expect(onPatchFn).not.toHaveBeenCalled();
    });

    test("observable instances do emit a patch when shouldEmitPatchOnChange returns true", () => {
      const shouldEmitPatchOnChangeFn = jest.fn(() => true);
      const observableArray = observable.array<string>([]);

      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView({ shouldEmitPatchOnChange: shouldEmitPatchOnChangeFn })
        get arrayLength() {
          return observableArray.length;
        }
      }

      const instance = MyViewExample.create({ key: "1", name: "Test" });
      expect(shouldEmitPatchOnChangeFn).toHaveBeenCalled();

      const onPatchFn = jest.fn();
      onPatch(instance, onPatchFn);

      runInAction(() => {
        observableArray.push("a");
      });

      expect(onPatchFn).toHaveBeenCalled();
      expect(onPatchFn.mock.calls).toEqual([
        [
          { op: "replace", path: "/__snapshottedViewsEpoch", value: 1 },
          { op: "replace", path: "/__snapshottedViewsEpoch", value: 0 },
        ],
      ]);
    });

    test("observable instances don't emit a patch when shouldEmitPatchOnChange is undefined and setDefaultShouldEmitPatchOnChange hasn't been called", () => {
      const observableArray = observable.array<string>([]);

      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView()
        get arrayLength() {
          return observableArray.length;
        }
      }

      const instance = MyViewExample.create({ key: "1", name: "Test" });

      const onPatchFn = jest.fn();
      onPatch(instance, onPatchFn);

      runInAction(() => {
        observableArray.push("a");
      });

      expect(onPatchFn).not.toHaveBeenCalled();
    });

    test("observable instances do emit a patch when shouldEmitPatchOnChange is undefined and setDefaultShouldEmitPatchOnChange was passed true", () => {
      setDefaultShouldEmitPatchOnChange(true);

      const observableArray = observable.array<string>([]);

      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView()
        get arrayLength() {
          return observableArray.length;
        }
      }

      const instance = MyViewExample.create({ key: "1", name: "Test" });

      const onPatchFn = jest.fn();
      onPatch(instance, onPatchFn);

      runInAction(() => {
        observableArray.push("a");
      });

      expect(onPatchFn).toHaveBeenCalled();
      expect(onPatchFn).toHaveBeenCalled();
      expect(onPatchFn.mock.calls).toEqual([
        [
          { op: "replace", path: "/__snapshottedViewsEpoch", value: 1 },
          { op: "replace", path: "/__snapshottedViewsEpoch", value: 0 },
        ],
      ]);
    });

    test("observable instances don't emit a patch when shouldEmitPatchOnChange is undefined and setDefaultShouldEmitPatchOnChange was passed false", () => {
      setDefaultShouldEmitPatchOnChange(false);

      const observableArray = observable.array<string>([]);

      @register
      class MyViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
        @snapshottedView()
        get arrayLength() {
          return observableArray.length;
        }
      }

      const instance = MyViewExample.create({ key: "1", name: "Test" });

      const onPatchFn = jest.fn();
      onPatch(instance, onPatchFn);

      runInAction(() => {
        observableArray.push("a");
      });

      expect(onPatchFn).not.toHaveBeenCalled();
    });
  });
});

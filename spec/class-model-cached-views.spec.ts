import { ClassModel, action, cachedView, getSnapshot, register, types } from "../src";

@register
class ViewExample extends ClassModel({ key: types.identifier, name: types.string }) {
  @cachedView()
  get slug() {
    return this.name.toLowerCase().replace(/ /g, "-");
  }

  @action
  setName(name: string) {
    this.name = name;
  }
}

describe("class model cached views", () => {
  test("an observable instance saves the view value in a snapshot when changed", () => {
    const instance = ViewExample.create({ key: "1", name: "Test" });
    expect(instance.slug).toEqual("test");
    let snapshot = getSnapshot(instance);
    expect(snapshot).toEqual({ key: "1", name: "Test" }); // no snapshot output as the object hasn't changed yet
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

  test("an readonly instance returns the view value from the snapshot if present", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test", slug: "test" } as any);
    expect(instance.slug).toEqual("test");
  });

  test("an readonly instance doesn't recompute the view value from the snapshot", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test", slug: "whatever" } as any);
    expect(instance.slug).toEqual("whatever");
  });

  test("an readonly instance doesn't call the computed function if given a snapshot value", () => {
    const fn = jest.fn();
    @register
    class Spy extends ClassModel({ name: types.string }) {
      @cachedView()
      get slug() {
        fn();
        return this.name.toLowerCase().replace(/ /g, "-");
      }
    }

    const instance = Spy.createReadOnly({ name: "Test", slug: "whatever" } as any);
    expect(instance.slug).toEqual("whatever");
    expect(fn).not.toHaveBeenCalled();
  });

  test("an observable instance doesn't call the computed function until snapshotted", () => {
    const fn = jest.fn();
    @register
    class Spy extends ClassModel({ name: types.string }) {
      @cachedView()
      get slug() {
        fn();
        return this.name.toLowerCase().replace(/ /g, "-");
      }
      @action
      setName(name: string) {
        this.name = name;
      }
    }

    const instance = Spy.create({ name: "Test", slug: "whatever" } as any);
    expect(fn).not.toHaveBeenCalled();
    getSnapshot(instance);
    expect(fn).not.toHaveBeenCalled();

    instance.setName("New Name");
    expect(fn).toHaveBeenCalled();
  });

  test("an readonly instance doesn't require the snapshot to include the cache", () => {
    const instance = ViewExample.createReadOnly({ key: "1", name: "Test" });
    expect(instance.slug).toEqual("test");
  });

  test("cached views can be passed nested within snapshots", () => {
    @register
    class Outer extends ClassModel({ examples: types.array(ViewExample) }) {}

    const instance = Outer.createReadOnly({
      examples: [{ key: "1", name: "Test", slug: "test-foobar" } as any, { key: "2", name: "Test 2", slug: "test-qux" } as any],
    });

    expect(instance.examples[0].slug).toEqual("test-foobar");
    expect(instance.examples[1].slug).toEqual("test-qux");
  });

  describe("with a hydrator", () => {
    @register
    class HydrateExample extends ClassModel({ url: types.string }) {
      @cachedView<URL>({
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

    test("cached views with processors can be accessed on observable instances", () => {
      const instance = HydrateExample.create({ url: "https://gadget.dev/blog/feature?utm=whatever" });
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature"));
    });

    test("cached views with processors can be accessed on readonly instances when there's no input data", () => {
      const instance = HydrateExample.create({ url: "https://gadget.dev/blog/feature?utm=whatever" });
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature"));
    });

    test("cached views with processors can be accessed on readonly instances when there is input data", () => {
      const instance = HydrateExample.createReadOnly({
        url: "https://gadget.dev/blog/feature?utm=whatever",
        withoutParams: "https://gadget.dev/blog/feature/extra", // pass a different value so we can be sure it is what is being used
      } as any);
      expect(instance.withoutParams).toEqual(new URL("https://gadget.dev/blog/feature/extra"));
    });
  });
});

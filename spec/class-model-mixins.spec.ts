import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { Constructor } from "../src";
import { IAnyClassModelType, IAnyStateTreeNode, extend } from "../src";
import { getSnapshot } from "../src";
import { ClassModel, action, register, types } from "../src";
import { volatile } from "../src/class-model";
import { create } from "./helpers";
import { NameExample } from "./fixtures/NameExample";

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
  class MixedIn extends extend(Klass, { otherProp: types.string }) {
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

const AddViewMixin = <T extends Constructor<{ name: string }>>(Klass: T) => {
  class MixedIn extends Klass {
    get mixinGetter() {
      return this.name.toUpperCase();
    }

    mixinView() {
      return this.name.toLowerCase();
    }
  }

  return MixedIn;
};

const AddActionMixin = <T extends Constructor<{ name: string }>>(Klass: T) => {
  class MixedIn extends Klass {
    @action
    mixinSetName(name: string) {
      this.name = name;
    }
  }

  return MixedIn;
};

const AddVolatileMixin = <T extends Constructor<{ name: string }>>(Klass: T) => {
  class MixedIn extends Klass {
    @volatile((_instance) => "test")
    mixinVolatile!: string;

    @action
    mixinSetVolatile(value: string) {
      this.mixinVolatile = value;
    }
  }

  return MixedIn;
};

@register
class ChainedA extends AddVolatileMixin(
  AddViewMixin(
    AddActionMixin(
      ClassModel({
        name: types.string,
      })
    )
  )
) {}

@register
class ChainedB extends AddActionMixin(
  AddViewMixin(
    AddVolatileMixin(
      ClassModel({
        name: types.string,
      })
    )
  )
) {}

@register
class ChainedC extends AddActionMixin(
  AddVolatileMixin(
    AddViewMixin(
      ClassModel({
        name: types.string,
      })
    )
  )
) {}

describe("class model mixins", () => {
  describe.each([
    ["Chain A", ChainedA],
    ["Chain B", ChainedB],
    ["Chain C", ChainedC],
  ])("%s", (_name, Klass) => {
    test("function views can be added to classes by mixins", () => {
      let instance = Klass.createReadOnly({ name: "Test" });
      expect(instance.mixinView()).toBe("test");

      instance = Klass.create({ name: "Test" });
      expect(instance.mixinView()).toBe("test");
    });

    test("getter views can be added to classes by mixins", () => {
      let instance = Klass.createReadOnly({ name: "Test" });
      expect(instance.mixinGetter).toBe("TEST");

      instance = Klass.create({ name: "Test" });
      expect(instance.mixinGetter).toBe("TEST");
    });

    test("actions can be added to classes by mixins", () => {
      const instance = Klass.create({ name: "Test" });
      instance.mixinSetName("another test");
      expect(instance.name).toBe("another test");
    });

    test("actions added by mixins are present on readonly instances", () => {
      const instance = Klass.createReadOnly({ name: "Test" });
      expect("mixinSetName" in instance).toBe(true);
    });

    test("volatiles can be added to classes by mixins", () => {
      let instance = Klass.createReadOnly({ name: "Test" });
      expect(instance.mixinVolatile).toBe("test");

      instance = Klass.create({ name: "Test" });
      expect(instance.mixinVolatile).toBe("test");
      instance.mixinSetVolatile("new value");
      expect(instance.mixinVolatile).toBe("new value");
    });
  });

  test("should allow props to be added to child classes safe access to the child class and parent class members", () => {
    const instance = create(ExtendedNameExample, { key: "1", name: "Test", extraProp: "whatever" });
    expect(instance.key).toEqual("1");
    expect(instance.extraProp).toEqual("whatever");
    expect(instance.nameLength).toEqual(4);
    expect(instance.extendedNameLength).toEqual(4);
    assert<IsExact<string, typeof instance.name>>(true);
    assert<IsExact<number, typeof instance.nameLength>>(true);
    assert<IsExact<number, typeof instance.extendedNameLength>>(true);
    assert<IsExact<number | undefined, typeof instance.extraPropLength>>(true);

    const snapshot = getSnapshot(instance);
    expect(snapshot.key).toEqual("1");
    expect(snapshot.name).toEqual("Test");
    expect(snapshot.extraProp).toEqual("whatever");
  });

  test("should allow typesafe access to properties added by extensions in a class factory", () => {
    const instance = create(ExtendedMixedInNameExample, { key: "1", name: "Test", otherProp: "other" });
    expect(instance.key).toEqual("1");
    expect(instance.nameLength).toEqual(4);
    expect(instance.mixinView).toEqual("hello");
    expect(instance.otherProp).toEqual("other");

    assert<IsExact<string, typeof instance.mixinView>>(true);
    assert<IsExact<string, typeof instance.otherProp>>(true);
    assert<IsExact<Date, typeof instance.subclassView>>(true);

    const snapshot = getSnapshot(instance);
    expect(snapshot.key).toEqual("1");
    expect(snapshot.name).toEqual("Test");
    expect(snapshot.otherProp).toEqual("other");
  });

  test(".is should correctly report instances of the extended model", () => {
    const instance = create(ExtendedMixedInNameExample, { key: "1", name: "Test", otherProp: "other" });
    expect(ExtendedMixedInNameExample.is(instance)).toBe(true);
    expect(ExtendedMixedInNameExample.is({})).toBe(false);
  });
});

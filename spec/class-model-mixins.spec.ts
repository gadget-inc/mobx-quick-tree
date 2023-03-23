import { ClassModel, action, register, types } from "../src";
import { volatile } from "../src/class-model";
import type { Constructor } from "./helpers";

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
});

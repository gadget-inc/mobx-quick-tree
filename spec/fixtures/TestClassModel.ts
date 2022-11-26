import { types } from "../../src";
import { action, ClassModel, register, view } from "../../src/class-model";

@register
export class NamedThingClass extends ClassModel({
  key: types.identifier,
  name: types.string,
}) {
  @view
  lowerCasedName() {
    return this.name.toLowerCase();
  }

  @view
  upperCasedName() {
    return this.name.toUpperCase();
  }
}

@register
export class TestClassModel extends ClassModel({
  bool: types.boolean,
  frozen: types.frozen<{ test: "string" }>(),
  nested: NamedThingClass,
  array: types.array(NamedThingClass),
  map: types.map(types.late(() => NamedThingClass)),
  optional: "value",
}) {
  @view
  get notBool() {
    return !this.bool;
  }

  @view
  get arrayLength(): number {
    return this.array.length;
  }

  @action
  setB(v: boolean) {
    this.bool = v;
  }
}

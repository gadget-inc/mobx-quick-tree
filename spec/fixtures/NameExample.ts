import { flow, types } from "../../src";
import { ClassModel, action, register, volatile, volatileAction } from "../../src/class-model";

@register
export class NameExample extends ClassModel({ key: types.identifier, name: types.string }) {
  @action
  setName(newName: string) {
    this.name = newName;
    return true;
  }

  slug() {
    return this.name.toLowerCase().replace(/ /g, "-");
  }

  @action
  setNameAsync = flow(function* (this: NameExample, newName: string) {
    yield Promise.resolve();
    this.name = newName;
    return true;
  });

  get nameLength() {
    return this.name.length;
  }

  @volatile(() => "test")
  volatileProp!: string;

  @action
  setVolatileProp(newProp: string) {
    this.volatileProp = newProp;
    return true;
  }

  @volatileAction
  setVolatilePropOnReadonly(newProp: string) {
    this.volatileProp = newProp;
    return true;
  }
}

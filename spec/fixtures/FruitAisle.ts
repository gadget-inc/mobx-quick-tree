import { action } from "mobx";
import { ClassModel, register, types } from "../../src";
import { nodeTypeType } from "./LargeRoot";

@register
export class Apple extends ClassModel({
  type: nodeTypeType("Apple"),
  color: types.optional(types.string, "red"),
  ripeness: types.integer,
}) {
  @action
  bite() {
    console.log("Bite!");
  }
}

@register
export class Banana extends ClassModel({
  type: nodeTypeType("Banana"),
  spots: types.optional(types.number, 0),
  ripeness: types.number,
}) {}

@register
export class BananaBunch extends ClassModel({
  type: nodeTypeType("BananaBunch"),
  bananas: types.array(Banana),
  origin: types.string,
}) {}

@register
export class Pear extends ClassModel({
  type: nodeTypeType("Pear"),
  color: types.optional(types.string, "green"),
  breed: types.optional(types.string, "Bartlett"),
}) {}

@register
export class Kiwi extends ClassModel({
  type: nodeTypeType("Kiwi"),
  seedCount: types.optional(types.number, 100),
}) {}

@register
export class Orange extends ClassModel({
  type: nodeTypeType("Orange"),
  size: types.enumeration("size", ["small", "medium", "large"]),
}) {}

@register
export class Passionfruit extends ClassModel({
  type: nodeTypeType("Passionfruit"),
  color: types.optional(types.string, "yellow"),
}) {}

export const Fruit = types.union({ discriminator: "type" }, Apple, Banana, BananaBunch, Pear, Kiwi, Orange, Passionfruit);

@register
export class FruitBin extends ClassModel({
  type: nodeTypeType("FruitBin"),
  fruit: types.late(() => Fruit),
  count: types.integer,
}) {}

@register
export class FruitAisle extends ClassModel({
  type: nodeTypeType("FruitAisle"),
  bins: types.map(FruitBin),
}) {}

import { action, ClassModel, register, types, view } from "../../src";

export const defaultNowDateType = types.optional(types.Date, () => new Date());
export const nodeTypeType = <T extends string>(type: T) => types.optional(types.literal(type), type);

@register
export class Part extends ClassModel({
  type: nodeTypeType("Part"),
  key: types.identifier,
  name: types.string,
  sku: types.string,
  cost: types.number,
  properties: types.frozen<Record<string, any>>(),
  createdAt: defaultNowDateType,
}) {}

@register
export class PartLine extends ClassModel({
  type: nodeTypeType("PartLine"),
  part: types.reference(Part),
  quantity: types.optional(types.number, 0),
  createdAt: defaultNowDateType,
}) {
  @view
  cost() {
    return this.part.cost * this.quantity;
  }
}

@register
export class Component extends ClassModel({
  type: nodeTypeType("Component"),
  key: types.identifier,
  name: types.string,
  parts: types.map(PartLine),
  createdAt: defaultNowDateType,
}) {
  @view
  cost() {
    return [...this.parts.values()].map((line) => line.cost()).reduce((a, b) => a + b);
  }
}

@register
export class Car extends ClassModel({
  type: nodeTypeType("Car"),
  key: types.identifier,
  make: types.string,
  model: types.string,
  year: types.number,
  description: types.string,
  components: types.map(Component),
  createdAt: defaultNowDateType,
}) {
  @action
  setMake(make: string) {
    this.make = make;
  }

  @action
  setModel(model: string) {
    this.model = model;
  }

  @action
  setYear(year: number) {
    this.year = year;
  }

  @view
  descriptor() {
    return `${this.make} ${this.model} ${this.year}`;
  }

  @view
  cost() {
    return `${this.make} ${this.model} ${this.year}`;
  }
}

@register
export class Salesperson extends ClassModel({
  type: nodeTypeType("Salesperson"),
  key: types.identifier,
  firstName: types.string,
  lastName: types.string,
  email: types.maybeNull(types.string),
  phoneNumber: types.maybeNull(types.string),
  createdAt: defaultNowDateType,
}) {
  @view
  get name() {
    return this.firstName + " " + this.lastName;
  }
}

@register
export class Dealership extends ClassModel({
  type: nodeTypeType("Dealership"),
  key: types.identifier,
  name: types.string,
  streetAddress: types.string,
  city: types.string,
  province: types.string,
  postalCode: types.string,
  country: types.string,
  salespeople: types.array(types.reference(Salesperson)),
  createdAt: defaultNowDateType,
}) {
  @view
  descriptor() {
    return `${this.streetAddress}, ${this.city}, ${this.country}`;
  }
}

@register
export class Customer extends ClassModel({
  type: nodeTypeType("Customer"),
  key: types.identifier,
  firstName: types.string,
  lastName: types.string,
  email: types.maybeNull(types.string),
  phoneNumber: types.maybeNull(types.string),
  createdAt: defaultNowDateType,
}) {}

@register
export class OrderLineItem extends ClassModel({
  type: nodeTypeType("OrderLineItem"),
  key: types.identifier,
  car: types.reference(Car),
  price: types.number,
  createdAt: defaultNowDateType,
}) {}

@register
export class Order extends ClassModel({
  type: nodeTypeType("Order"),
  key: types.identifier,
  dealership: types.reference(Dealership),
  salesperson: types.reference(Salesperson),
  customer: types.reference(Customer),
  lineItems: types.array(OrderLineItem),
  createdAt: defaultNowDateType,
}) {}

@register
export class LargeRoot extends ClassModel({
  type: nodeTypeType("LargeRoot"),
  cars: types.map(Car),
  parts: types.map(Part),
  dealerships: types.map(Dealership),
  salespeople: types.map(Salesperson),
  customers: types.map(Customer),
  orders: types.map(Order),
}) {}

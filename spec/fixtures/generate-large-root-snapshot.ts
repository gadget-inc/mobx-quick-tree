import { faker } from "@faker-js/faker";
import fs from "fs";
import type { SnapshotOut } from "../../src";
import type { LargeRoot, Part } from "./LargeRoot";

faker.seed(42);

const randomArrayElement = <T>(array: T[]) => {
  const index = faker.datatype.number({ min: 0, max: array.length - 1 });
  return array[index];
};

const snapshot: SnapshotOut<typeof LargeRoot> = {
  type: "LargeRoot",
  parts: {},
  cars: {},
  dealerships: {},
  salespeople: {},
  customers: {},
  orders: {},
};

const parts: SnapshotOut<typeof Part>[] = [];

for (let i = 0; i < 30; i++) {
  const key = faker.git.commitSha();
  const part: SnapshotOut<typeof Part> = {
    type: "Part",
    key,
    name: faker.commerce.productName(),
    sku: faker.git.commitSha(),
    cost: i,
    properties: JSON.parse(faker.datatype.json()),
    createdAt: Number(faker.date.past()),
  };
  snapshot.parts[key] = part;
  parts.push(part);
}

for (let i = 0; i < 30; i++) {
  const key = faker.git.commitSha();
  snapshot.cars[key] = {
    type: "Car",
    key,
    make: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    year: faker.datatype.number({ min: 2000, max: 2021 }),
    description: faker.lorem.paragraph(),
    createdAt: Number(faker.date.past()),
    components: {},
  };

  const componentCount = faker.datatype.number({ min: 1, max: 10 });
  for (let j = 0; j < componentCount; j++) {
    const componentKey = faker.git.commitSha();
    snapshot.cars[key].components[componentKey] = {
      type: "Component",
      key: componentKey,
      name: faker.commerce.productName(),
      createdAt: Number(faker.date.past()),
      parts: {},
    };

    const partCount = faker.datatype.number({ min: 1, max: 10 });
    for (let k = 0; k < partCount; k++) {
      const partKey = faker.git.commitSha();
      snapshot.cars[key].components[componentKey].parts[partKey] = {
        type: "PartLine",
        part: randomArrayElement(parts).key,
        quantity: faker.datatype.number({ min: 1, max: 10 }),
        createdAt: Number(faker.date.past()),
      };
    }
  }
}

for (let i = 0; i < 50; i++) {
  const key = faker.git.commitSha();
  snapshot.salespeople[key] = {
    type: "Salesperson",
    key,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    createdAt: Number(faker.date.past()),
  };
}

for (let i = 0; i < 10; i++) {
  const key = faker.git.commitSha();
  snapshot.dealerships[key] = {
    type: "Dealership",
    key,
    name: faker.company.name(),
    createdAt: Number(faker.date.past()),
    streetAddress: faker.address.streetAddress(),
    city: faker.address.city(),
    province: faker.address.state(),
    postalCode: faker.address.zipCode(),
    country: faker.address.country(),
    salespeople: [],
  };
}

for (let i = 0; i < 50; i++) {
  const key = faker.git.commitSha();
  snapshot.customers[key] = {
    type: "Customer",
    key,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    createdAt: Number(faker.date.past()),
  };
}

for (let i = 0; i < 50; i++) {
  const key = faker.git.commitSha();
  snapshot.orders[key] = {
    type: "Order",
    key,
    createdAt: Number(faker.date.past()),
    customer: randomArrayElement(Object.keys(snapshot.customers)),
    salesperson: randomArrayElement(Object.keys(snapshot.salespeople)),
    dealership: randomArrayElement(Object.keys(snapshot.dealerships)),
    lineItems: [],
  };
  const lineCount = faker.datatype.number({ min: 1, max: 3 });
  for (let k = 0; k < lineCount; k++) {
    snapshot.orders[key].lineItems.push({
      type: "OrderLineItem",
      key: faker.git.commitSha(),
      car: randomArrayElement(Object.keys(snapshot.cars)),
      price: Number(faker.commerce.price()),
      createdAt: Number(faker.date.past()),
    });
  }
}

fs.writeFileSync(__dirname + "/large-root-snapshot.json", JSON.stringify(snapshot, null, 2));

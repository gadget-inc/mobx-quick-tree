import { benchmarker } from "./benchmark";
import { types } from "../src";

const PersonModel = types.model("Person", {
  id: types.identifier,
  name: types.string,
  managerId: types.maybe(types.string),
  departmentId: types.maybe(types.string),
});

const DepartmentModel = types.model("Department", {
  id: types.identifier,
  name: types.string,
  managerId: types.safeReference(PersonModel),
  employeeIds: types.array(types.safeReference(PersonModel)),
});

const CompanyModel = types.model("Company", {
  people: types.array(PersonModel),
  departments: types.array(DepartmentModel),
});

function generateDeferredReferenceSnapshot(peopleCount: number, departmentCount: number) {
  const people: any[] = [];
  const departments: any[] = [];

  for (let i = 0; i < peopleCount; i++) {
    people.push({
      id: `person-${i}`,
      name: `Person ${i}`,
      managerId: i > 0 ? `person-${Math.floor(i / 2)}` : undefined,
      departmentId: `dept-${i % departmentCount}`,
    });
  }

  for (let i = 0; i < departmentCount; i++) {
    departments.push({
      id: `dept-${i}`,
      name: `Department ${i}`,
      managerId: `person-${i % peopleCount}`,
      employeeIds: Array.from({ length: 10 }, (_, j) => `person-${(i * 10 + j) % peopleCount}`),
    });
  }

  return { people, departments };
}

export default benchmarker(async (suite) => {
  const smallSnapshot = generateDeferredReferenceSnapshot(100, 10);
  const mediumSnapshot = generateDeferredReferenceSnapshot(500, 25);
  const largeSnapshot = generateDeferredReferenceSnapshot(1000, 50);

  suite.add("small deferred references (100 people, 10 departments)", function () {
    CompanyModel.createReadOnly(smallSnapshot);
  });

  suite.add("medium deferred references (500 people, 25 departments)", function () {
    CompanyModel.createReadOnly(mediumSnapshot);
  });

  suite.add("large deferred references (1000 people, 50 departments)", function () {
    CompanyModel.createReadOnly(largeSnapshot);
  });

  return suite;
});

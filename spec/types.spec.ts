/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import type { SnapshotIn, TypesForModelPropsDeclaration } from "../src";
import { IMaybeNullType, INodeModelType, IOptionalType, ISimpleType, types } from "../src";
import { NamedThingClass, TestClassModel } from "./fixtures/TestClassModel";
import { NamedThing, TestModel } from "./fixtures/TestModel";

describe("type helper unit type tests", () => {
  test("TypesForModelPropsDeclaration converts model prop declarations to uniform ITypes", () => {
    const declaration = {
      str: types.string,
      literal: "foobar",
      num: types.number,
      opt: types.optional(types.string, "hello"),
      nullable: types.maybeNull(types.string),
      model: NamedThing,
      modelClass: NamedThingClass,
    };

    type Actual = TypesForModelPropsDeclaration<typeof declaration>;
    type Expected = {
      str: ISimpleType<string>;
      literal: IOptionalType<ISimpleType<string>, [undefined]>;
      num: ISimpleType<number>;
      opt: IOptionalType<ISimpleType<string>, [undefined]>;
      nullable: IMaybeNullType<ISimpleType<string>>;
      model: INodeModelType<
        {
          key: ISimpleType<string>;
          name: ISimpleType<string>;
        },
        { lowerCasedName(): string; upperCasedName(): string }
      >;
      modelClass: typeof NamedThingClass;
    };

    assert<IsExact<Actual, Expected>>(true);
  });
});

describe("SnapshotIn", () => {
  test("computes the type of a node model input snapshot", () => {
    type Actual = SnapshotIn<typeof TestModel>;
    assert<IsExact<Actual["bool"], boolean>>(true);
    assert<IsExact<Actual["optional"], string | undefined>>(true);
  });

  test("computes the type of a class model input snapshot", () => {
    type Actual = SnapshotIn<typeof TestClassModel>;
    assert<IsExact<Actual["bool"], boolean>>(true);
    assert<IsExact<Actual["optional"], string | undefined>>(true);
  });
});

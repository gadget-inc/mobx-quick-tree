/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { Has, IsExact } from "conditional-type-checks";
import { assert } from "conditional-type-checks";
import {
  ClassModel,
  IMaybeNullType,
  INodeModelType,
  IOptionalType,
  ISimpleType,
  SnapshotIn,
  TypesForModelPropsDeclaration,
  action,
  register,
  snapshottedView,
  types,
} from "../src";
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

type Constructor = new (...args: any[]) => {};

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

  test("works on class models with mixins", () => {
    const classModelMixin = <T extends Constructor>(Klass: T) => {
      class MixedIn extends Klass {
        get mixinView() {
          return "hello";
        }
        @action
        mixinAction(_value: string) {
          // empty
        }
      }

      return MixedIn;
    };

    @register
    class MixedInClass extends classModelMixin(TestClassModel) {}

    type Actual = SnapshotIn<typeof MixedInClass>;
    assert<IsExact<Actual["bool"], boolean>>(true);
    assert<IsExact<Actual["optional"], string | undefined>>(true);
    assert<Has<keyof Actual, "mixinView">>(false);
  });

  test("works on class models with snapshotted views", () => {
    @register
    class DataContainer extends ClassModel({ id: types.identifier }) {}

    @register
    class DataMap extends ClassModel({ stuff: types.map(DataContainer) }) {}

    @register
    class _SnapshottedViewClass extends TestClassModel {
      @snapshottedView<typeof DataMap>({
        createReadOnly: (value) => DataMap.createReadOnly(value),
      })
      get test() {
        return DataMap.createReadOnly();
      }
    }
  });
});

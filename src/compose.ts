import { types as mstTypes } from "mobx-state-tree";
import { ModelType } from "./model";

type IAnyModelType = ModelType<any, any>;

type ComposeFactory = {
  <Types extends [IAnyModelType, ...IAnyModelType[]]>(name: string, ...types: Types): ModelType<
    PropsFromTypes<Types>,
    OthersFromTypes<Types>
  >;
  <Types extends [IAnyModelType, ...IAnyModelType[]]>(...types: Types): ModelType<
    PropsFromTypes<Types>,
    OthersFromTypes<Types>
  >;
};

type PropsFromTypes<T> = T extends ModelType<infer P, any>
  ? P
  : T extends [ModelType<infer P, any>, ...infer Tail]
  ? P & PropsFromTypes<Tail>
  : {};

type OthersFromTypes<T> = T extends ModelType<any, infer O>
  ? O
  : T extends [ModelType<any, infer O>, ...infer Tail]
  ? O & OthersFromTypes<Tail>
  : {};

export const compose: ComposeFactory = <Types extends [IAnyModelType, ...IAnyModelType[]]>(
  nameOrType: IAnyModelType | string,
  ...types: Types
): ModelType<PropsFromTypes<Types>, OthersFromTypes<Types>> => {
  let name: string | undefined = undefined;
  if (nameOrType instanceof ModelType) {
    types.unshift(nameOrType);
    name = nameOrType.name;
  } else {
    name = nameOrType;
  }

  const props = types.reduce((props, model) => ({ ...props, ...model.properties }), {});
  const initializer = (self: any) => {
    for (const type of types) {
      type.initializeViewsAndActions(self);
    }
  };

  // We ignore the overloading MST has put on compose, to avoid writing out an annoying `switch`
  const mstComposedModel = (mstTypes.compose as any)(name, ...types.map((t) => t.mstType));

  return new ModelType(name, props, initializer, mstComposedModel) as ModelType<
    PropsFromTypes<Types>,
    OthersFromTypes<Types>
  >;
};

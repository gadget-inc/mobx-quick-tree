import { types as mstTypes } from "mobx-state-tree";
import type { ModelInitializer } from "./model";
import { ModelType } from "./model";
import type { IAnyModelType, IModelType } from "./types";

type PropsFromTypes<T> = T extends IModelType<infer P, any>
  ? P
  : T extends [IModelType<infer P, any>, ...infer Tail]
  ? P & PropsFromTypes<Tail>
  : {};

type OthersFromTypes<T> = T extends IModelType<any, infer O>
  ? O
  : T extends [IModelType<any, infer O>, ...infer Tail]
  ? O & OthersFromTypes<Tail>
  : {};

type ComposeFactory = {
  <Types extends [IAnyModelType, ...IAnyModelType[]]>(name: string, ...types: Types): IModelType<
    PropsFromTypes<Types>,
    OthersFromTypes<Types>
  >;
  <Types extends [IAnyModelType, ...IAnyModelType[]]>(...types: Types): IModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
};

export const compose: ComposeFactory = (nameOrType: IAnyModelType | string, ...types: IAnyModelType[]): IAnyModelType => {
  let name: string | undefined = undefined;
  if (typeof nameOrType == "string") {
    name = nameOrType;
  } else {
    types.unshift(nameOrType);
    name = nameOrType.name;
  }

  const props = types.reduce((props, model) => ({ ...props, ...model.properties }), {});
  const initializers = types.reduce<ModelInitializer[]>((inits, model) => (model as ModelType<any, any>).initializers.concat(inits), []);

  // We ignore the overloading MST has put on compose, to avoid writing out an annoying `switch`
  const mstComposedModel = (mstTypes.compose as any)(name, ...types.map((t) => t.mstType));

  // TODO see if there's a good way to not have to do this cast
  return new ModelType(props, initializers, mstComposedModel);
};

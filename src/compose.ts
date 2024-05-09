import { types as mstTypes } from "mobx-state-tree";
import type { ModelInitializer } from "./model";
import { ModelType } from "./model";
import type { IAnyNodeModelType, INodeModelType } from "./types";

type PropsFromTypes<T> =
  T extends INodeModelType<infer P, any> ? P : T extends [INodeModelType<infer P, any>, ...infer Tail] ? P & PropsFromTypes<Tail> : {};

type OthersFromTypes<T> =
  T extends INodeModelType<any, infer O> ? O : T extends [INodeModelType<any, infer O>, ...infer Tail] ? O & OthersFromTypes<Tail> : {};

type ComposeFactory = {
  <Types extends [IAnyNodeModelType, ...IAnyNodeModelType[]]>(
    name: string,
    ...types: Types
  ): INodeModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
  <Types extends [IAnyNodeModelType, ...IAnyNodeModelType[]]>(
    ...types: Types
  ): INodeModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
};

export const compose: ComposeFactory = (nameOrType: IAnyNodeModelType | string, ...types: IAnyNodeModelType[]): IAnyNodeModelType => {
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

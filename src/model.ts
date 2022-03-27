import { IModelType, types as mstTypes } from "mobx-state-tree";
import { BaseType } from "./base";

export interface ModelProperties {
  [key: string]: BaseType<any, any, any>;
}

export type ModelCreationProps<T extends ModelProperties> = {
  [K in keyof T]?: T[K]["InputType"];
};

export type MSTProperties<T extends ModelProperties> = {
  [K in keyof T]: T[K]["mstType"];
};

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  ModelCreationProps<Props>,
  Props & Others,
  IModelType<MSTProperties<Props>, Others>
> {
  constructor(
    name: string,
    readonly properties: Props,
    readonly initializeViewsAndActions: (self: any) => any,
    mstModel: IModelType<MSTProperties<Props>, Others>
  ) {
    super(name, mstModel);
  }

  views<Views extends Object>(fn: (self: any) => Views): ModelType<Props, Others & Views> {
    const init = (self: any) => {
      Object.assign(self, fn(self));
      return self;
    };
    return new ModelType<Props, Others & Views>(this.name, this.properties, init, this.mstType.views(fn));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const instance = {} as this["InstanceType"];

    for (const [k, v] of Object.entries(this.properties)) {
      Reflect.set(instance, k, v.createReadOnly(snapshot?.[k]));
    }

    this.initializeViewsAndActions(instance);

    return instance;
  }
}

export const model = <Props extends ModelProperties>(name: string, properties?: Props) => {
  const mstProperties =
    properties &&
    (Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, v.mstType])) as MSTProperties<Props>);

  return new ModelType(name, properties, (self) => self, mstTypes.model(name, mstProperties));
};

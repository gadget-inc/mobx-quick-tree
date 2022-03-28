import { IModelType, Instance, ModelActions, types as mstTypes, types } from "mobx-state-tree";
import { BaseType, QuickOrMSTInstance, setParent, setType } from "./base";
import { $identifier, $modelType } from "./symbols";

export interface ModelProperties {
  [key: string]: BaseType<any, any, any>;
}

export type ModelCreationProps<T extends ModelProperties> = {
  [K in keyof T]?: T[K]["InputType"];
};

export type InstanceTypes<T extends ModelProperties> = {
  [K in keyof T]: T[K]["InstanceType"];
};

export type MSTProperties<T extends ModelProperties> = {
  [K in keyof T]: T[K]["mstType"];
};

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  ModelCreationProps<Props>,
  InstanceTypes<Props> & Others,
  IModelType<MSTProperties<Props>, Others>
> {
  readonly [$modelType] = undefined;
  readonly QuickOrSlowInstance!: this["InstanceType"] | Instance<this["mstType"]>;
  private identifierProp: string | undefined;

  constructor(
    name: string,
    readonly properties: Props,
    readonly initializeViewsAndActions: (self: any) => any,
    mstModel: IModelType<MSTProperties<Props>, Others>
  ) {
    super(name, mstModel);
    this.identifierProp = Object.keys(this.properties).find((name) => properties[name].mstType === types.identifier);
  }

  views<Views extends Record<string, unknown>>(
    fn: (self: QuickOrMSTInstance<this>) => Views
  ): ModelType<Props, Others & Views> {
    const init = (self: QuickOrMSTInstance<this>) => {
      this.initializeViewsAndActions(self);
      Object.assign(self, fn(self));
      return self;
    };
    return new ModelType<Props, Others & Views>(this.name, this.properties, init, this.mstType.views(fn));
  }

  actions<Actions extends ModelActions>(
    fn: (self: QuickOrMSTInstance<this>) => Actions
  ): ModelType<Props, Others & Actions> {
    const init = (self: QuickOrMSTInstance<this>) => {
      this.initializeViewsAndActions(self);

      const actions = fn(self);
      for (const actionName of Object.keys(actions)) {
        Reflect.set(self, actionName, () => {
          throw new Error(`can't execute action "${actionName}" on a read-only instance`);
        });
      }

      return self;
    };
    return new ModelType<Props, Others & Actions>(this.name, this.properties, init, this.mstType.actions(fn));
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const instance = {} as this["InstanceType"];

    setType(instance, this);

    for (const [k, v] of Object.entries(this.properties)) {
      const propValue = v.createReadOnly(snapshot?.[k]);
      setParent(propValue, instance);
      Reflect.set(instance, k, propValue);
    }

    if (this.identifierProp) {
      Reflect.set(instance, $identifier, instance[this.identifierProp]);
    }

    this.initializeViewsAndActions(instance);

    return instance;
  }
}

export const model = <Props extends ModelProperties>(name: string, properties?: Props) => {
  const props = properties ?? ({} as Props);
  const mstProperties = (
    props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.mstType])) : {}
  ) as MSTProperties<Props>;

  return new ModelType(name, props, (self) => self, mstTypes.model(name, mstProperties));
};

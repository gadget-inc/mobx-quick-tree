import { IModelType, Instance, ModelActions, types as mstTypes } from "mobx-state-tree";
import { BaseType, QuickOrMSTInstance } from "./base";
import { $modelType, $parent, $type } from "./symbols";

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
  readonly QuickOrSlowInstance: this["InstanceType"] | Instance<this["mstType"]>;

  constructor(
    name: string,
    readonly properties: Props,
    readonly initializeViewsAndActions: (self: any) => any,
    mstModel: IModelType<MSTProperties<Props>, Others>
  ) {
    super(name, mstModel);
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

  is(value: any): value is QuickOrMSTInstance<this> {
    if (typeof value !== "object") {
      return false;
    }

    // Fast path for read-only types
    if ($type in value) {
      return value[$type] === this;
    }

    return this.mstType.is(value);
  }

  createReadOnly(snapshot?: this["InputType"]): this["InstanceType"] {
    const instance = {} as this["InstanceType"];

    Reflect.set(instance, $type, this);

    for (const [k, v] of Object.entries(this.properties)) {
      const propValue = v.createReadOnly(snapshot?.[k]);
      if (typeof propValue == "object" && $type in propValue && $modelType in propValue[$type]) {
        propValue[$parent] = instance;
      }

      Reflect.set(instance, k, propValue);
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

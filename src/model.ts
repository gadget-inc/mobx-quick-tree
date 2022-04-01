import {
  IModelType as MSTModelType,
  Instance as MSTInstance,
  isReferenceType,
  types as mstTypes,
} from "mobx-state-tree";
import { BaseType, setParent, setType } from "./base";
import { $identifier, $modelType } from "./symbols";
import type {
  IModelType,
  InputTypesForModelProps,
  Instance,
  InstanceTypesForModelProps,
  InstantiateContext,
  ModelActions,
  ModelProperties,
  MSTPropertiesForModelProps,
  OutputTypesForModelProps,
} from "./types";

const mstPropsFromQuickProps = <Props extends ModelProperties>(props: Props): MSTPropertiesForModelProps<Props> => {
  return (
    props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.mstType])) : {}
  ) as MSTPropertiesForModelProps<Props>;
};

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  InputTypesForModelProps<Props>,
  OutputTypesForModelProps<Props>,
  InstanceTypesForModelProps<Props> & Others,
  MSTModelType<MSTPropertiesForModelProps<Props>, Others>
> {
  readonly [$modelType] = undefined;
  readonly Props!: Props;
  readonly Others!: Others;
  readonly QuickOrSlowInstance!: this["InstanceType"] | MSTInstance<this["mstType"]>;

  private identifierProp: string | undefined;

  constructor(
    name: string,
    readonly properties: Props,
    readonly initializeViewsAndActions: (self: any) => any,
    mstModel: MSTModelType<MSTPropertiesForModelProps<Props>, Others>
  ) {
    super(name, mstModel);
    this.identifierProp = Object.keys(this.properties).find((name) => properties[name].mstType === mstTypes.identifier);
  }

  views<Views extends Record<string, unknown>>(fn: (self: Instance<this>) => Views): ModelType<Props, Others & Views> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);
      Object.assign(self, fn(self));
      return self;
    };
    return new ModelType<Props, Others & Views>(this.name, this.properties, init, this.mstType.views(fn as any));
  }

  actions<Actions extends ModelActions>(fn: (self: Instance<this>) => Actions): ModelType<Props, Others & Actions> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);

      const actions = fn(self as any);
      for (const actionName of Object.keys(actions)) {
        Reflect.set(self, actionName, () => {
          throw new Error(`can't execute action "${actionName}" on a read-only instance`);
        });
      }

      return self;
    };
    return new ModelType<Props, Others & Actions>(this.name, this.properties, init, this.mstType.actions(fn as any));
  }

  props<AdditionalProps extends ModelProperties>(props: AdditionalProps): ModelType<Props & AdditionalProps, Others> {
    return new ModelType(
      this.name,
      { ...this.properties, ...props },
      this.initializeViewsAndActions,
      this.mstType.props(mstPropsFromQuickProps(props))
    );
  }

  named(newName: string): ModelType<Props, Others> {
    return new ModelType(newName, this.properties, this.initializeViewsAndActions, this.mstType);
  }

  volatile<TP extends object>(fn: (self: Instance<this>) => TP): IModelType<Props, Others & TP> {
    // TODO implement me
    return null as any;
  }

  extend<A extends ModelActions = {}, V extends Object = {}, VS extends Object = {}>(
    fn: (self: Instance<this>) => {
      actions?: A;
      views?: V;
      state?: VS;
    }
  ): IModelType<Props, Others & A & V & VS> {
    // TODO implement me
    return null as any;
  }

  instantiate(snapshot: this["InputType"], context: InstantiateContext): this["InstanceType"] {
    const instance = {} as this["InstanceType"];

    setType(instance, this);

    for (const [k, v] of Object.entries(this.properties)) {
      if (isReferenceType(v.mstType)) {
        context.referencesToResolve.push(() => {
          const propValue = v.instantiate(snapshot?.[k], context);
          Reflect.set(instance, k, propValue);
        });
        continue;
      }

      const propValue = v.instantiate(snapshot?.[k], context);
      setParent(propValue, instance);
      Reflect.set(instance, k, propValue);
    }

    if (this.identifierProp) {
      const id = instance[this.identifierProp];
      Reflect.set(instance, $identifier, id);
      context.referenceCache[id] = instance;
    }

    this.initializeViewsAndActions(instance);

    return instance;
  }
}

export type ModelFactory = {
  <Props extends ModelProperties>(properties?: Props): IModelType<Props, {}>;
  <Props extends ModelProperties>(name: string, properties?: Props): IModelType<Props, {}>;
};

export const model: ModelFactory = <Props extends ModelProperties>(
  nameOrProperties: string | Props | undefined,
  properties?: Props
) => {
  let props: Props;
  let name = "model";
  if (typeof nameOrProperties === "string") {
    name = nameOrProperties;
    props = properties ?? ({} as Props);
  } else {
    props = nameOrProperties ?? ({} as Props);
  }

  return new ModelType(name, props, (self) => self, mstTypes.model(name, mstPropsFromQuickProps(props)));
};

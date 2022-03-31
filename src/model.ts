import { IModelType, Instance, isReferenceType, types as mstTypes, types } from "mobx-state-tree";
import { BaseType, setParent, setType } from "./base";
import { $identifier, $modelType } from "./symbols";
import type {
  InstanceTypes,
  InstantiateContext,
  ModelActions,
  ModelCreationProps,
  ModelProperties,
  MSTProperties,
  QuickOrMSTInstance,
} from "./types";

const mstPropsFromQuickProps = <Props extends ModelProperties>(props: Props): MSTProperties<Props> => {
  return (
    props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.mstType])) : {}
  ) as MSTProperties<Props>;
};

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  ModelCreationProps<Props>,
  InstanceTypes<Props> & Others,
  IModelType<MSTProperties<Props>, Others>
> {
  readonly [$modelType] = undefined;
  readonly Props!: Props;
  readonly Others!: Others;
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
    fn: (self: Instance<this["mstType"]>) => Actions
  ): ModelType<Props, Others & Actions> {
    const init = (self: QuickOrMSTInstance<this>) => {
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
  <Props extends ModelProperties>(properties?: Props): ModelType<Props, {}>;
  <Props extends ModelProperties>(name: string, properties?: Props): ModelType<Props, {}>;
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

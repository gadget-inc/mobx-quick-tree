import {
  IModelType as MSTModelType,
  Instance as MSTInstance,
  isReferenceType,
  isStateTreeNode,
  types as mstTypes,
} from "mobx-state-tree";
import { BaseType, setParent, setType } from "./base";
import { $identifier, $modelType, $type } from "./symbols";
import type {
  IModelType,
  InputsForModel,
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

const assignProps = (target: any, source: any) => {
  if (target && source) {
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const [name, desc] of Object.entries(descriptors)) {
      Object.defineProperty(target, name, {
        ...desc,
        enumerable: false,
      });
    }
  }
};

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  InputsForModel<InputTypesForModelProps<Props>>,
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
    this.identifierProp = this.mstType.identifierAttribute;
  }

  views<Views extends Object>(fn: (self: Instance<this>) => Views): ModelType<Props, Others & Views> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);
      assignProps(self, fn(self));
      return self;
    };
    return new ModelType<Props, Others & Views>(this.name, this.properties, init, this.mstType.views(fn as any));
  }

  actions<Actions extends ModelActions>(fn: (self: Instance<this>) => Actions): ModelType<Props, Others & Actions> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);
      assignProps(self, fn(self));
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

  volatile<VolatileState extends Record<string, any>>(
    fn: (self: Instance<this>) => VolatileState
  ): IModelType<Props, Others & VolatileState> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);
      assignProps(self, fn(self));
      return self;
    };

    return new ModelType<Props, Others & VolatileState>(
      this.name,
      this.properties,
      init,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.mstType.volatile(fn as any)
    );
  }

  extend<Actions extends ModelActions = {}, Views extends Object = {}, VolatileState extends Object = {}>(
    fn: (self: Instance<this>) => {
      actions?: Actions;
      views?: Views;
      state?: VolatileState;
    }
  ): IModelType<Props, Others & Actions & Views & VolatileState> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);

      const { actions, views, state } = fn(self);
      assignProps(self, views);
      assignProps(self, state);
      assignProps(self, actions);
      return self;
    };

    return new ModelType<Props, Others & Actions & Views & VolatileState>(
      this.name,
      this.properties,
      init,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore fn should work regardless, but
      this.mstType.extend(fn)
    );
  }

  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (isStateTreeNode(value)) {
      return this.mstType.is(value);
    }

    if (typeof value !== "object" || value === null) {
      return false;
    }

    if (Object.getPrototypeOf(value) != Object.prototype) {
      return false;
    }

    if (value[$type] === this) {
      return true;
    }

    return Object.entries(this.properties).every(([name, prop]) => prop.is(value[name]));
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
): IModelType<Props, {}> => {
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

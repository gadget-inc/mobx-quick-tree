import { IModelType as MSTModelType, Instance as MSTInstance, isReferenceType, isStateTreeNode, types as mstTypes } from "mobx-state-tree";
import { types } from ".";
import { BaseType, setParent, setType } from "./base";
import { $identifier, $modelType, $type } from "./symbols";
import type {
  EmptyObject,
  IModelType,
  InputsForModel,
  InputTypesForModelProps,
  Instance,
  InstanceTypesForModelProps,
  InstantiateContext,
  ModelActions,
  ModelProperties,
  ModelPropertiesDeclaration,
  ModelViews,
  MSTPropertiesForModelProps,
  OutputTypesForModelProps,
  TypesForModelPropsDeclaration,
} from "./types";

const propsFromModelPropsDeclaration = <Props extends ModelPropertiesDeclaration>(props: Props): TypesForModelPropsDeclaration<Props> => {
  return Object.fromEntries(
    Object.entries(props).map(([k, v]) => {
      switch (typeof v) {
        case "string":
          return [k, types.optional(types.string, v)];
        case "boolean":
          return [k, types.optional(types.boolean, v)];
        case "number":
          return [k, types.optional(types.number, v)];
        default:
          if (v instanceof Date) {
            return [k, types.optional(types.Date, v)];
          }
          return [k, v];
      }
    })
  ) as TypesForModelPropsDeclaration<Props>;
};

const mstPropsFromQuickProps = <Props extends ModelProperties>(props: Props): MSTPropertiesForModelProps<Props> => {
  return (props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.mstType])) : {}) as MSTPropertiesForModelProps<Props>;
};

const assignProps = (target: any, source: any, cache = true) => {
  if (target && source) {
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const [name, desc] of Object.entries(descriptors)) {
      const getter = desc.get;
      if (cache && getter) {
        Object.defineProperty(target, name, {
          get() {
            const value = desc.get?.apply(target);
            Object.defineProperty(target, name, { value });
            return value;
          },
          configurable: true,
        });
      } else {
        Object.defineProperty(target, name, {
          ...desc,
          enumerable: false,
          writable: true,
        });
      }
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

  views<Views extends ModelViews>(fn: (self: Instance<this>) => Views): ModelType<Props, Others & Views> {
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
      assignProps(self, fn(self), false);
      return self;
    };
    return new ModelType<Props, Others & Actions>(this.name, this.properties, init, this.mstType.actions(fn as any));
  }

  props<AdditionalProps extends ModelPropertiesDeclaration>(
    propsDecl: AdditionalProps
  ): ModelType<Props & TypesForModelPropsDeclaration<AdditionalProps>, Others> {
    const props = propsFromModelPropsDeclaration(propsDecl);
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

  volatile<VolatileState extends ModelViews>(fn: (self: Instance<this>) => VolatileState): IModelType<Props, Others & VolatileState> {
    const init = (self: Instance<this>) => {
      this.initializeViewsAndActions(self);
      assignProps(self, fn(self));
      return self;
    };

    return new ModelType<Props, Others & VolatileState>(this.name, this.properties, init, this.mstType.volatile(fn as any));
  }

  extend<Actions extends ModelActions, Views extends ModelViews, VolatileState extends ModelViews>(
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
      assignProps(self, actions, false);
      return self;
    };

    return new ModelType<Props, Others & Actions & Views & VolatileState>(
      this.name,
      this.properties,
      init,
      this.mstType.extend<Actions, Views, VolatileState>(fn as any)
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
    const instance: Record<string | symbol, any> = {};

    setType(instance, this);

    for (const [propName, propType] of Object.entries(this.properties)) {
      if (isReferenceType(propType.mstType)) {
        context.referencesToResolve.push(() => {
          const propValue = propType.instantiate(snapshot?.[propName], context);
          instance[propName] = propValue;
        });
        continue;
      }

      const propValue = propType.instantiate(snapshot?.[propName], context);
      setParent(propValue, instance);
      instance[propName] = propValue;
    }

    if (this.identifierProp) {
      const id = instance[this.identifierProp];
      instance[$identifier] = id;
      context.referenceCache[id] = instance;
    }

    this.initializeViewsAndActions(instance);

    return instance as this["InstanceType"];
  }
}

export type ModelFactory = {
  <Props extends ModelPropertiesDeclaration>(properties?: Props): IModelType<TypesForModelPropsDeclaration<Props>, EmptyObject>;
  <Props extends ModelPropertiesDeclaration>(name: string, properties?: Props): IModelType<
    TypesForModelPropsDeclaration<Props>,
    EmptyObject
  >;
};

export const model: ModelFactory = <Props extends ModelPropertiesDeclaration>(
  nameOrProperties: string | Props | undefined,
  properties?: Props
): IModelType<TypesForModelPropsDeclaration<Props>, EmptyObject> => {
  let propsDecl: Props;
  let name = "model";
  if (typeof nameOrProperties === "string") {
    name = nameOrProperties;
    propsDecl = properties ?? ({} as Props);
  } else {
    propsDecl = nameOrProperties ?? ({} as Props);
  }

  // TODO figure out how to make these types compatible
  const props = propsFromModelPropsDeclaration(propsDecl);
  return new ModelType(name, props, (self) => self, mstTypes.model(name, mstPropsFromQuickProps(props))) as any;
};

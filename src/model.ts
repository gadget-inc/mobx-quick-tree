import {
  IAnyModelType as MSTAnyModelType,
  IAnyType as MSTAnyType,
  isReferenceType,
  isStateTreeNode as mstIsStateTreeNode,
  types as mstTypes,
} from "mobx-state-tree";
import { types } from ".";
import { isStateTreeNode } from "./api";
import { BaseType, setParent, setType } from "./base";
import { $identifier, $type } from "./symbols";
import type {
  IAnyStateTreeNode,
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

const mstPropsFromQuickProps = <Props extends ModelProperties>(props: Props): Record<string, MSTAnyType> => {
  return props ? Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.mstType])) : {};
};

const assignProps = (target: any, source: any, cache = true) => {
  if (target && source) {
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const [name, desc] of Object.entries(descriptors)) {
      const getter = desc.get;
      if (cache && getter) {
        let cached = false;
        let cachedValue: unknown;
        Object.defineProperty(target, name, {
          get() {
            if (cached) return cachedValue;
            cachedValue = getter.apply(target);
            cached = true;
            return cachedValue;
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

export type ModelInitializer = (self: any) => void;

export class ModelType<Props extends ModelProperties, Others> extends BaseType<
  InputsForModel<InputTypesForModelProps<Props>>,
  OutputTypesForModelProps<Props>,
  InstanceTypesForModelProps<Props> & Others
> {
  readonly Props!: Props;
  readonly Others!: Others;
  readonly mstType!: MSTAnyModelType;

  private identifierProp: string | undefined;

  constructor(name: string, readonly properties: Props, readonly initializers: ModelInitializer[], mstType: MSTAnyModelType) {
    super(name, mstType);
    this.identifierProp = this.mstType.identifierAttribute;
  }

  views<Views extends ModelViews>(fn: (self: Instance<this>) => Views): ModelType<Props, Others & Views> {
    const init = (self: Instance<this>) => assignProps(self, fn(self));
    return new ModelType<Props, Others & Views>(this.name, this.properties, [...this.initializers, init], this.mstType.views(fn as any));
  }

  actions<Actions extends ModelActions>(fn: (self: Instance<this>) => Actions): ModelType<Props, Others & Actions> {
    const init = (self: Instance<this>) => assignProps(self, fn(self), false);
    return new ModelType<Props, Others & Actions>(
      this.name,
      this.properties,
      [...this.initializers, init],
      this.mstType.actions(fn as any)
    );
  }

  props<AdditionalProps extends ModelPropertiesDeclaration>(
    propsDecl: AdditionalProps
  ): ModelType<Props & TypesForModelPropsDeclaration<AdditionalProps>, Others> {
    const props = propsFromModelPropsDeclaration(propsDecl);
    return new ModelType(this.name, { ...this.properties, ...props }, this.initializers, this.mstType.props(mstPropsFromQuickProps(props)));
  }

  named(newName: string): ModelType<Props, Others> {
    return new ModelType(newName, this.properties, this.initializers, this.mstType);
  }

  volatile<VolatileState extends ModelViews>(fn: (self: Instance<this>) => VolatileState): IModelType<Props, Others & VolatileState> {
    const init = (self: Instance<this>) => assignProps(self, fn(self));
    return new ModelType<Props, Others & VolatileState>(
      this.name,
      this.properties,
      [...this.initializers, init],
      this.mstType.volatile(fn as any)
    );
  }

  extend<Actions extends ModelActions, Views extends ModelViews, VolatileState extends ModelViews>(
    fn: (self: Instance<this>) => {
      actions?: Actions;
      views?: Views;
      state?: VolatileState;
    }
  ): IModelType<Props, Others & Actions & Views & VolatileState> {
    const init = (self: Instance<this>) => {
      const { actions, views, state } = fn(self);
      assignProps(self, views);
      assignProps(self, state);
      assignProps(self, actions, false);
    };

    return new ModelType<Props, Others & Actions & Views & VolatileState>(
      this.name,
      this.properties,
      [...this.initializers, init],
      this.mstType.extend<Actions, Views, VolatileState>(fn as any)
    );
  }

  is(value: IAnyStateTreeNode): value is this["InstanceType"];
  is(value: any): value is this["InputType"] | this["InstanceType"] {
    if (mstIsStateTreeNode(value)) {
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

  instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"] {
    if (isStateTreeNode(snapshot)) {
      return snapshot as this["InstanceType"];
    }

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
      context.referenceCache.set(id, instance);
    }

    for (const init of this.initializers) {
      init(instance);
    }

    return instance as this["InstanceType"];
  }
}

export type ModelFactory = {
  (): IModelType<{}, {}>;
  (name: string): IModelType<{}, {}>;
  <Props extends ModelPropertiesDeclaration>(properties: Props): IModelType<TypesForModelPropsDeclaration<Props>, {}>;
  <Props extends ModelPropertiesDeclaration>(name: string, properties: Props): IModelType<TypesForModelPropsDeclaration<Props>, {}>;
};

export const model: ModelFactory = <Props extends ModelPropertiesDeclaration>(
  nameOrProperties?: string | Props,
  properties?: Props
): IModelType<TypesForModelPropsDeclaration<Props>, {}> => {
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
  return new ModelType(name, props, [], mstTypes.model(name, mstPropsFromQuickProps(props))) as any;
};

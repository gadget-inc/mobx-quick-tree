import type { IModelType as MSTIModelType, ModelActions } from "mobx-state-tree";
import { types as mstTypes } from "mobx-state-tree";
import "reflect-metadata";
import { setEnv, setType } from "./base";
import { defaultThrowAction, instantiateInstanceFromProperties, mstPropsFromQuickProps, propsFromModelPropsDeclaration } from "./model";
import { $registered, $requiresRegistration, $type } from "./symbols";
import type {
  IAnyType,
  IClassModelType,
  InputsForModel,
  InputTypesForModelProps,
  InstantiateContext,
  ModelPropertiesDeclaration,
  ModelViews,
  TypesForModelPropsDeclaration,
} from "./types";

const kClassModelPropertyMetadata = Symbol.for("mqt:class-model-property-metadata");
type ClassModelPropertyMetadata =
  | {
    type: "action";
  }
  | { type: "view" }
  | { type: "volatile" };

/**
 * Create a new base class for a ClassModel to extend. This is a function that you call that returns a class (a class factory).
 *
 * @example
 *
 * class MyModel extends ClassModel({ name: types.string }) {
 *   @view
 *   get upperCasedName() {
 *     return this.name.toUpperCase();
 *   }
 *
 *   @action
 *   setName(name: string) {
 *     this.name = name;
 *   }
 * }
 */
export const ClassModel = <PropsDeclaration extends ModelPropertiesDeclaration>(
  propertiesDeclaration: PropsDeclaration
): IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>> => {
  const props = propsFromModelPropsDeclaration(propertiesDeclaration);
  return class Base {
    static isMQTClassModel = true as const;
    static properties = props;
    static mstType: MSTIModelType<any, any>;
    static readonly [$requiresRegistration] = true;

    readonly [$type]?: IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>>;

    constructor(
      attrs?: InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<PropsDeclaration>>>,
      env?: any,
      readonly = false,
      context?: InstantiateContext
    ) {
      const mstType = (this.constructor as IClassModelType<any>).mstType;

      if (readonly) {
        const isRoot = !context;
        context ??= {
          referenceCache: new Map(),
          referencesToResolve: [],
          env,
        };

        setType(this, this.constructor as any);
        setEnv(this, context.env);
        instantiateInstanceFromProperties(this, attrs, props, mstType.identifierAttribute, context);

        if (isRoot) {
          for (const resolver of context.referencesToResolve) {
            resolver();
          }
        }
      } else {
        return mstType.create(attrs);
      }
    }
  } as any;
};

/**
 * Class decorator for registering MQT class models as setup.
 */
export function register<Klass>(object: Klass): Klass {
  const klass = object as any as IClassModelType<any>;
  const mstActions: ModelActions = {};
  const mstViews: ModelViews = {};

  for (const [key, property] of Object.entries(Object.getOwnPropertyDescriptors(klass.prototype))) {
    const metadata: ClassModelPropertyMetadata | undefined = Reflect.getMetadata(kClassModelPropertyMetadata, klass.prototype, key);
    if (metadata) {
      switch (metadata.type) {
        case "action":
          // add the action to the MST actions we'll add to the MST model type
          Object.defineProperty(mstActions, key, {
            ...property,
            enumerable: true,
          });

          // mark the action as not-runnable on the readonly class
          Object.defineProperty(klass.prototype, key, {
            ...property,
            enumerable: true,
            value: defaultThrowAction(key),
          });

          break;
        case "view":
          Object.defineProperty(mstViews, key, {
            ...property,
            enumerable: true,
          });
          break;
        case "volatile":
          // TODO
          break;
      }
    }
  }

  // conform to the API that the other MQT types expect for creating instances
  klass.instantiate = (snapshot, context) => {
    return new klass(snapshot, context.env, true, context);
  };
  (klass as any).is = (value: any) => value instanceof klass || klass.mstType.is(value);
  klass.create = (snapshot, env) => klass.mstType.create(snapshot, env);
  klass.createReadOnly = (snapshot, env) => new klass(snapshot, env, true);

  // create the MST type for not-readonly versions of this using the views and actions extracted from the class
  (klass as any).mstType = mstTypes
    .model(klass.name, mstPropsFromQuickProps(klass.properties))
    .views((self) => bindToSelf(self, mstViews))
    .actions((self) => bindToSelf(self, mstActions));

  klass.prototype[$type] = klass;
  (klass as any)[$registered] = true

  return klass as any;
}

/**
 * Function decorator for registering MST actions within MQT class models.
 */
export const action = (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "action" }, target, propertyKey);
};

/**
 * Function decorator for registering MST views within MQT class models.
 */
export const view = (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "view" }, target, propertyKey);
};

/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
export const volatile = (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => {
  Reflect.defineMetadata(kClassModelPropertyMetadata, { type: "volatile" }, target, propertyKey);
};

function bindToSelf<T extends Record<string, any>>(self: object, inputs: T): T {
  const outputs = {} as T;
  for (const [key, property] of Object.entries(Object.getOwnPropertyDescriptors(inputs))) {
    if (typeof property.value === "function") {
      property.value = property.value.bind(self);
    }
    if (typeof property.get === "function") {
      property.get = property.get.bind(self);
    }
    if (typeof property.set === "function") {
      property.set = property.set.bind(self);
    }
    Object.defineProperty(outputs, key, property);
  }
  return outputs;
}

/**
 * Ensure a given type is registered if it requires registration.
 * Throws an error if a type requires registration but has not been registered.
 * @hidden
 */
export const ensureRegistered = (type: IAnyType) => {
  let chain = type;
  while (chain) {
    if ((chain as any)[$requiresRegistration]) {
      if (!(type as any)[$registered]) {
        throw new Error(`Type ${type.name} requires registration but has not been registered yet. Add the @register decorator to it for it to function correctly.`)
      }
      break;
    }
    chain = Object.getPrototypeOf(chain);
  }
}
import type { IModelType as MSTIModelType, ModelActions } from "mobx-state-tree";
import { types as mstTypes } from "mobx-state-tree";
import "reflect-metadata";
import { defaultThrowAction, instantiateInstanceFromProperties, mstPropsFromQuickProps, propsFromModelPropsDeclaration } from "./model";
import { $env, $readOnly, $registered, $requiresRegistration, $type } from "./symbols";
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

type ActionMetadata = {
  type: "action";
  property: string;
  described: boolean;
};

type ViewMetadata = {
  type: "view";
  property: string;
};

export type VolatileMetadata = {
  type: "volatile";
  property: string;
  initializer: VolatileInitializer<any>;
};

type VolatileInitializer<T> = (instance: T) => Record<string, any>;

const metadataPrefix = "mqt:properties";
const viewKeyPrefix = `${metadataPrefix}:view`;
const actionKeyPrefix = `${metadataPrefix}:action`;
const volatileKeyPrefix = `${metadataPrefix}:volatile`;

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

    readonly [$env]?: any;

    constructor(
      attrs?: InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<PropsDeclaration>>>,
      env?: any,
      context?: InstantiateContext,
      /** @hidden */ hackyPreventInitialization = false
    ) {
      if (hackyPreventInitialization) {
        return;
      }

      const klass = this.constructor as IClassModelType<any>;

      const isRoot = !context;
      context ??= {
        referenceCache: new Map(),
        referencesToResolve: [],
        env,
      };

      this[$env] = env;
      instantiateInstanceFromProperties(this, attrs, props, klass.mstType.identifierAttribute, context);
      initializeVolatiles(this, this, klass.volatiles);

      if (isRoot) {
        for (const resolver of context.referencesToResolve) {
          resolver();
        }
      }
    }

    get [$readOnly]() {
      return true;
    }

    get [$type]() {
      return this.constructor as IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>>;
    }
  } as any;
};

/**
 * Class decorator for registering MQT class models as setup.
 *
 * @example
 * ```
 *   @register
 *   class Example extends ClassModel({ name: types.string }) {
 *     @view
 *     get bigName() {
 *       return this.name.toUpperCase();
 *     }
 *   }
 * ```
 */
export function register<Klass extends { new (...args: any[]): {} }>(object: Klass) {
  const klass = object as any as IClassModelType<any>;
  const mstActions: ModelActions = {};
  const mstViews: ModelViews = {};
  const mstVolatiles: Record<string, VolatileMetadata> = {};

  // list all keys defined at the prototype level to search for volatiles and actions
  const metadataKeys = Reflect.getMetadataKeys(klass.prototype);
  for (const metadataKey of metadataKeys.filter((key) => key.startsWith(metadataPrefix))) {
    const metadata = Reflect.getMetadata(metadataKey, klass.prototype) as ActionMetadata | ViewMetadata | VolatileMetadata;
    switch (metadata.type) {
      case "view": {
        Object.defineProperty(mstViews, metadata.property, {
          ...Object.getOwnPropertyDescriptor(klass.prototype, metadata.property),
          enumerable: true,
        });
        break;
      }
      case "action": {
        let target: any;
        if (metadata.described) {
          target = klass.prototype;
        } else {
          // hackily instantiate the class to get at the instance level properties defined by the class body (those that aren't on the prototype)
          target = new (klass as any)({}, undefined, undefined, true);
        }
        const descriptor = Object.getOwnPropertyDescriptor(target, metadata.property);

        // add the action to the MST actions we'll add to the MST model type
        Object.defineProperty(mstActions, metadata.property, {
          ...descriptor,
          enumerable: true,
        });

        // mark the action as not-runnable on the readonly class
        Object.defineProperty(klass.prototype, metadata.property, {
          ...descriptor,
          enumerable: true,
          value: defaultThrowAction(metadata.property),
        });

        break;
      }
      case "volatile": {
        mstVolatiles[metadata.property] = metadata;
      }
    }
  }

  klass.volatiles = mstVolatiles;

  // conform to the API that the other MQT types expect for creating instances
  klass.instantiate = (snapshot, context) => {
    return new klass(snapshot, context.env, context);
  };
  (klass as any).is = (value: any) => value instanceof klass || klass.mstType.is(value);
  klass.create = (snapshot, env) => klass.mstType.create(snapshot, env);
  klass.createReadOnly = (snapshot, env) => new klass(snapshot, env);

  // create the MST type for not-readonly versions of this using the views and actions extracted from the class
  klass.mstType = mstTypes
    .model(klass.name, mstPropsFromQuickProps(klass.properties))
    .views((self) => bindToSelf(self, mstViews))
    .actions((self) => bindToSelf(self, mstActions));

  if (Object.keys(mstVolatiles).length > 0) {
    // define the volatile properties in one shot by running any passed initializers
    (klass as any).mstType = (klass as any).mstType.volatile((self: any) => initializeVolatiles({}, self, mstVolatiles));
  }

  (klass as any)[$registered] = true;

  return klass as any;
}

/**
 * Function decorator for registering MST actions within MQT class models.
 */
export const action = (target: any, property: string, descriptor?: PropertyDescriptor) => {
  const metadata: ActionMetadata = { type: "action", property, described: !!descriptor };
  Reflect.defineMetadata(`${actionKeyPrefix}:${property}`, metadata, target);
};

/**
 * Function decorator for registering MST views within MQT class models.
 */
export const view = (target: any, property: string, _descriptor: PropertyDescriptor) => {
  const metadata: ViewMetadata = { type: "view", property };
  Reflect.defineMetadata(`${viewKeyPrefix}:${property}`, metadata, target);
};

/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
export function volatile(initializer: (instance: any) => any) {
  return (target: any, property: string) => {
    const metadata: VolatileMetadata = { type: "volatile", property: property, initializer };
    Reflect.defineMetadata(`${volatileKeyPrefix}:${property}`, metadata, target);
  };
}

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
        throw new Error(
          `Type ${type.name} requires registration but has not been registered yet. Add the @register decorator to it for it to function correctly.`
        );
      }
      break;
    }
    chain = Object.getPrototypeOf(chain);
  }
};

function initializeVolatiles(result: Record<string, any>, node: Record<string, any>, volatiles: Record<string, VolatileMetadata>) {
  for (const [key, metadata] of Object.entries(volatiles)) {
    result[key] = metadata.initializer(node);
  }
  return result;
}

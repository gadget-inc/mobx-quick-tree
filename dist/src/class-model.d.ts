import "reflect-metadata";
import { $volatileDefiner } from "./symbols";
import type { IAnyType, IClassModelType, InputsForModel, InputTypesForModelProps, ModelPropertiesDeclaration, TypesForModelPropsDeclaration } from "./types";
/** @internal */
export type VolatileMetadata = {
    type: "volatile";
    property: string;
    initializer: VolatileInitializer<any>;
};
type VolatileInitializer<T> = (instance: T) => Record<string, any>;
/**
 * A map of property keys to indicators for how that property should behave on the registered class
 **/
export type RegistrationTags = Record<string, typeof action | typeof view | VolatileDefiner>;
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
export declare const ClassModel: <PropsDeclaration extends ModelPropertiesDeclaration>(propertiesDeclaration: PropsDeclaration) => IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>, InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<PropsDeclaration>>>, import("./types").OutputTypesForModelProps<TypesForModelPropsDeclaration<PropsDeclaration>>>;
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
export declare function register<Klass extends {
    new (...args: any[]): {};
}>(object: Klass, tags?: RegistrationTags): any;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
export declare const action: (target: any, property: string) => void;
/**
 * Function decorator for registering MST views within MQT class models.
 */
export declare const view: (target: any, property: string, _descriptor: PropertyDescriptor) => void;
/**
 * A function for defining a volatile
 **/
export type VolatileDefiner = ((target: any, property: string) => void) & {
    [$volatileDefiner]: true;
    initializer: (instance: any) => any;
};
/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
export declare function volatile(initializer: (instance: any) => any): VolatileDefiner;
/**
 * Ensure a given type is registered if it requires registration.
 * Throws an error if a type requires registration but has not been registered.
 * @hidden
 */
export declare const ensureRegistered: (type: IAnyType) => void;
export {};

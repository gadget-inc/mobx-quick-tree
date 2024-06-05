import "reflect-metadata";
import type { Instance } from "mobx-state-tree";
import { $volatileDefiner } from "./symbols";
import type { Constructor, ExtendedClassModel, IAnyClassModelType, IAnyType, IClassModelType, ModelPropertiesDeclaration, TypesForModelPropsDeclaration } from "./types";
/** @internal */
type ActionMetadata = {
    type: "action";
    property: string;
    volatile: boolean;
};
/** Options that configure a snapshotted view */
export interface SnapshottedViewOptions<V, T extends IAnyClassModelType> {
    /** A function for snapshotting a view's value to JSON for storage in a snapshot */
    getSnapshot?: (value: V, snapshot: T["InputType"], node: Instance<T>) => any;
    /** A function for converting a stored value in the snapshot back to the rich type for the view to return */
    createReadOnly?: (value: V | undefined, snapshot: T["InputType"], node: Instance<T>) => V | undefined;
}
/** @internal */
export type ViewMetadata = {
    type: "view";
    property: string;
};
/** @internal */
export type SnapshottedViewMetadata = {
    type: "snapshotted-view";
    property: string;
    options: SnapshottedViewOptions<any, any>;
};
/** @internal */
export type VolatileMetadata = {
    type: "volatile";
    property: string;
    initializer: VolatileInitializer<any>;
};
type VolatileInitializer<T> = (instance: T) => Record<string, any>;
/** @internal */
export type PropertyMetadata = ActionMetadata | ViewMetadata | SnapshottedViewMetadata | VolatileMetadata;
/**
 * A map of property keys to indicators for how that property should behave on the registered class
 **/
export type RegistrationTags<T> = {
    [key in keyof T]: typeof action | typeof view | VolatileDefiner;
};
/**
 * Create a new base class for a ClassModel to extend. This is a function that you call that returns a class (a class factory).
 *
 * @example
 *
 * class MyModel extends ClassModel({ name: types.string }) {
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
export declare const ClassModel: <PropsDeclaration extends ModelPropertiesDeclaration>(propertiesDeclaration: PropsDeclaration) => IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>>;
/**
 * Class decorator for registering MQT class models as setup.
 *
 * @example
 * ```
 *   @register
 *   class Example extends ClassModel({ name: types.string }) {
 *     get bigName() {
 *       return this.name.toUpperCase();
 *     }
 *   }
 * ```
 */
export declare function register<Instance, Klass extends {
    new (...args: any[]): Instance;
}>(object: Klass, tags?: RegistrationTags<Instance>, name?: string): any;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
export declare const action: (target: any, property: string) => void;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
export declare const volatileAction: (target: any, property: string) => void;
/**
 * Function decorator for registering MST views within MQT class models.
 */
export declare const view: (target: any, property: string, _descriptor: PropertyDescriptor) => void;
/**
 * Function decorator for registering MQT snapshotted views within MQT class models. Stores the view's value into the snapshot when an instance is snapshotted, and uses that stored value for readonly instances created from snapshots.
 *
 * Can be passed an `options` object with a `preProcess` and/or `postProcess` function for transforming the cached value stored in the snapshot to and from the snapshot state.
 *
 * @example
 * class Example extends ClassModel({ name: types.string }) {
 *   @snapshottedView
 *   get slug() {
 *     return this.name.toLowerCase().replace(/ /g, "-");
 *   }
 * }
 *
 * @example
 * class Example extends ClassModel({ timestamp: types.string }) {
 *   @snapshottedView({ preProcess: (value) => new Date(value), postProcess: (value) => value.toISOString() })
 *   get date() {
 *     return new Date(timestamp).setTime(0);
 *   }
 * }
 */
export declare function snapshottedView<V, T extends IAnyClassModelType = IAnyClassModelType>(options?: SnapshottedViewOptions<V, T>): (target: any, property: string, _descriptor: PropertyDescriptor) => void;
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
 * Create a new class model that extends this class model, but with additional props added to the list of observable props.
 */
export declare function extend<T extends Constructor, SubClassProps extends ModelPropertiesDeclaration>(klass: T, props: SubClassProps): ExtendedClassModel<T, SubClassProps>;
/**
 * Ensure a given type is registered if it requires registration.
 * Throws an error if a type requires registration but has not been registered.
 * @hidden
 */
export declare const ensureRegistered: (type: IAnyType) => void;
/**
 * Get the property descriptor for a property from anywhere in the prototype chain
 * Similar to Object.getOwnPropertyDescriptor, but without the own bit
 */
export declare function getPropertyDescriptor(obj: any, property: string): PropertyDescriptor | null;
export declare const isClassModel: (type: IAnyType) => type is IClassModelType<any, any, any>;
export {};

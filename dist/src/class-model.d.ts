import "reflect-metadata";
import type { IClassModelType, InputsForModel, InputTypesForModelProps, ModelPropertiesDeclaration, TypesForModelPropsDeclaration } from "./types";
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
export declare const ClassModel: <PropsDeclaration extends ModelPropertiesDeclaration>(propertiesDeclaration: PropsDeclaration) => IClassModelType<TypesForModelPropsDeclaration<PropsDeclaration>, InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<PropsDeclaration>>>>;
/**
 * Class decorator for registering MQT class models as setup.
 */
export declare function register<Klass>(object: Klass): Klass;
/**
 * Function decorator for registering MST actions within MQT class models.
 */
export declare const action: (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => void;
/**
 * Function decorator for registering MST views within MQT class models.
 */
export declare const view: (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => void;
/**
 * Function decorator for registering MST volatiles within MQT class models.
 */
export declare const volatile: (target: any, propertyKey: string, _descriptor: PropertyDescriptor) => void;

import "reflect-metadata";
import type { InputTypesForModelProps, OutputTypesForModelProps, TypesForModelPropsDeclaration, ModelPropertiesDeclaration, InstantiateContext, IType, InputsForModel, InstanceTypesForModelProps } from "./types";
/**
 * IClassModelType represents the type of MQT class models. This is the class-level type, not the instance level type, so it has a typed `new()` and all the static functions/properties of a MQT class model.
 *
 * Importantly, `IClassModelType` is an `IType` that is compatible with the rest of the MQT/MST type ecosystem.
 **/
export interface IClassModelType<Props extends ModelPropertiesDeclaration, InstanceType> extends IType<InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<Props>>>, OutputTypesForModelProps<TypesForModelPropsDeclaration<Props>>, InstanceType> {
    isMQTClassModel: true;
    propertiesDeclaration: Props;
    new (attrs?: InputsForModel<InputTypesForModelProps<TypesForModelPropsDeclaration<Props>>>, env?: any, readonly?: boolean, context?: InstantiateContext): InstanceType;
}
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
export declare const ClassModel: <Props extends ModelPropertiesDeclaration>(propertiesDeclaration: Props) => IClassModelType<Props, InstanceTypesForModelProps<TypesForModelPropsDeclaration<Props>>>;
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

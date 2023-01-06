import type { IAnyModelType as MSTAnyModelType } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyStateTreeNode, IModelType, InputsForModel, InputTypesForModelProps, Instance, InstanceTypesForModelProps, InstantiateContext, ModelActions, ModelProperties, ModelPropertiesDeclaration, ModelViews, OutputTypesForModelProps, TypesForModelPropsDeclaration } from "./types";
export type ModelInitializer = (self: any) => void;
export declare class ModelType<Props extends ModelProperties, Others> extends BaseType<InputsForModel<InputTypesForModelProps<Props>>, OutputTypesForModelProps<Props>, InstanceTypesForModelProps<Props> & Others> {
    readonly properties: Props;
    readonly initializers: ModelInitializer[];
    readonly Props: Props;
    readonly Others: Others;
    readonly mstType: MSTAnyModelType;
    private identifierProp;
    private prototype;
    constructor(properties: Props, initializers: ModelInitializer[], mstType: MSTAnyModelType, prototype?: any);
    views<Views extends ModelViews>(fn: (self: Instance<this>) => Views): ModelType<Props, Others & Views>;
    actions<Actions extends ModelActions>(fn: (self: Instance<this>) => Actions): ModelType<Props, Others & Actions>;
    props<AdditionalProps extends ModelPropertiesDeclaration>(propsDecl: AdditionalProps): ModelType<Props & TypesForModelPropsDeclaration<AdditionalProps>, Others>;
    named(newName: string): ModelType<Props, Others>;
    volatile<VolatileState extends ModelViews>(fn: (self: Instance<this>) => VolatileState): IModelType<Props, Others & VolatileState>;
    extend<Actions extends ModelActions, Views extends ModelViews, VolatileState extends ModelViews>(fn: (self: Instance<this>) => {
        actions?: Actions;
        views?: Views;
        state?: VolatileState;
    }): IModelType<Props, Others & Actions & Views & VolatileState>;
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    instantiate(snapshot: this["InputType"] | undefined, context: InstantiateContext): this["InstanceType"];
}
export type ModelFactory = {
    (): IModelType<{}, {}>;
    (name: string): IModelType<{}, {}>;
    <Props extends ModelPropertiesDeclaration>(properties: Props): IModelType<TypesForModelPropsDeclaration<Props>, {}>;
    <Props extends ModelPropertiesDeclaration>(name: string, properties: Props): IModelType<TypesForModelPropsDeclaration<Props>, {}>;
};
export declare const model: ModelFactory;

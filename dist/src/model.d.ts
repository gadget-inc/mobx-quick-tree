import type { IAnyModelType as MSTAnyModelType, IAnyType as MSTAnyType } from "mobx-state-tree";
import { BaseType } from "./base";
import type { IAnyStateTreeNode, INodeModelType, IStateTreeNode, InputTypesForModelProps, InputsForModel, Instance, InstanceTypesForModelProps, TreeContext, ModelActions, ModelProperties, ModelPropertiesDeclaration, ModelViews, OutputTypesForModelProps, TypesForModelPropsDeclaration } from "./types";
export declare const propsFromModelPropsDeclaration: <Props extends ModelPropertiesDeclaration>(propsDecl: Props) => TypesForModelPropsDeclaration<Props>;
export declare const mstPropsFromQuickProps: <Props extends ModelProperties>(props: Props) => Record<string, MSTAnyType>;
export declare const instantiateInstanceFromProperties: (instance: any, snapshot: Record<string, any> | undefined, properties: ModelProperties, identifierProp: string | undefined, context: TreeContext) => void;
export declare const defaultThrowAction: (name: string, originalDescriptor?: PropertyDescriptor) => () => never;
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
    volatile<VolatileState extends ModelViews>(fn: (self: Instance<this>) => VolatileState): INodeModelType<Props, Others & VolatileState>;
    extend<Actions extends ModelActions, Views extends ModelViews, VolatileState extends ModelViews>(fn: (self: Instance<this>) => {
        actions?: Actions;
        views?: Views;
        state?: VolatileState;
    }): INodeModelType<Props, Others & Actions & Views & VolatileState>;
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    schemaHash: () => Promise<string>;
}
export type ModelFactory = {
    (): INodeModelType<{}, {}>;
    (name: string): INodeModelType<{}, {}>;
    <Props extends ModelPropertiesDeclaration>(properties: Props): INodeModelType<TypesForModelPropsDeclaration<Props>, {}>;
    <Props extends ModelPropertiesDeclaration>(name: string, properties: Props): INodeModelType<TypesForModelPropsDeclaration<Props>, {}>;
};
export declare const model: ModelFactory;

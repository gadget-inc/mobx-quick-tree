import type { IInterceptor, IMapDidChange, IMapWillChange, Lambda } from "mobx";
import type { IAnyType as MSTAnyType } from "mobx-state-tree";
import type { SnapshottedViewMetadata, VolatileMetadata } from "./class-model";
import type { $quickType, $registered, $type } from "./symbols";
export type { $quickType, $registered, $type } from "./symbols";
export type { IJsonPatch, IMiddlewareEvent, IPatchRecorder, ReferenceOptions, UnionOptions } from "mobx-state-tree";
export type Constructor<T = {}> = new (...args: any[]) => T;
export interface IType<InputType, OutputType, InstanceType> {
    /** @internal */
    readonly [$quickType]: undefined;
    readonly InputType: InputType;
    readonly OutputType: OutputType;
    readonly InstanceType: StateTreeNode<InstanceType, this>;
    readonly InstanceTypeWithoutSTN: InstanceType;
    readonly name: string;
    readonly mstType: MSTAnyType;
    is(value: IAnyStateTreeNode): value is this["InstanceType"];
    is(value: any): value is this["InputType"] | this["InstanceType"];
    create(snapshot?: InputType, env?: any): this["InstanceType"];
    createReadOnly(snapshot?: InputType, env?: any): this["InstanceType"];
    /** @hidden */
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): this["InstanceType"];
    /** Get a string hash for the schema of this type */
    schemaHash(): Promise<string>;
}
/**
 * Any type object in the system.
 * Examples: `types.string`, `types.model({})`, `types.array(types.string)`, `class Example extends ClassModel({})`, etc.
 */
export type IAnyType = IType<any, any, any> | IClassModelType<any, any, any>;
export type ISimpleType<T> = IType<T, T, T>;
export type IDateType = IType<Date | number, number, Date>;
export type IAnyComplexType = IType<any, any, object> | IClassModelType<any, any>;
/** Given any MQT type, get the type of an instance of the MQT type */
export type InstanceWithoutSTNTypeForType<T extends IAnyType> = T extends IType<any, any, any> ? T["InstanceTypeWithoutSTN"] : T extends IClassModelType<any, any> ? InstanceType<T> : T;
export interface INodeModelType<Props extends ModelProperties, Others> extends IType<InputsForModel<InputTypesForModelProps<Props>>, OutputTypesForModelProps<Props>, InstanceTypesForModelProps<Props> & Others> {
    readonly properties: Props;
    named(newName: string): INodeModelType<Props, Others>;
    props<Props2 extends ModelPropertiesDeclaration>(props: Props2): INodeModelType<Props & TypesForModelPropsDeclaration<Props2>, Others>;
    views<V extends ModelViews>(fn: (self: Instance<this>) => V): INodeModelType<Props, Others & V>;
    actions<A extends ModelActions>(fn: (self: Instance<this>) => A): INodeModelType<Props, Others & A>;
    volatile<TP extends ModelViews>(fn: (self: Instance<this>) => TP): INodeModelType<Props, Others & TP>;
    extend<A extends ModelActions, V extends ModelViews, VS extends ModelViews>(fn: (self: Instance<this>) => {
        actions?: A;
        views?: V;
        state?: VS;
    }): INodeModelType<Props, Others & A & V & VS>;
}
export interface IAnyNodeModelType extends IType<any, any, any> {
    readonly properties: any;
    named(newName: string): IAnyNodeModelType;
    props<Props2 extends ModelPropertiesDeclaration>(props: Props2): IAnyNodeModelType;
    views<V extends ModelViews>(fn: (self: Instance<this>) => V): IAnyNodeModelType;
    actions<A extends ModelActions>(fn: (self: Instance<this>) => A): IAnyNodeModelType;
    volatile<TP extends ModelViews>(fn: (self: Instance<this>) => TP): IAnyNodeModelType;
    extend<A extends ModelActions, V extends ModelViews, VS extends ModelViews>(fn: (self: Instance<this>) => {
        actions?: A;
        views?: V;
        state?: VS;
    }): IAnyNodeModelType;
}
/**
 * Extends a class model type T with new properties SubClassProps.
 */
export type ExtendedClassModel<T extends Constructor, SubClassProps extends ModelPropertiesDeclaration, Props extends ModelProperties = TypesForModelPropsDeclaration<SubClassProps>, InputType = InputsForModel<InputTypesForModelProps<Props>>, OutputType = OutputTypesForModelProps<Props>> = T & {
    InputType: InputType;
    OutputType: OutputType;
    new (...args: any[]): InstanceTypesForModelProps<Props> & {
        readonly [$type]?: [IClassModelType<Props, InputType, OutputType>] | [any];
    };
};
/**
 * `IClassModelType` represents the type of MQT class models. This is the class-level type, not the instance level type, so it has a typed `new()` and all the static functions/properties of a MQT class model.
 *
 * Note: `IClassModelType` is regrettably *not* an `IType`. `IClassModelType` is an interface that all class model classes implement. It's also the concrete type of the base class models returned by the ClassModel class factory. It'd be great if we could make `IClassModelType` extend `IType`, but, we would need to ensure the `Instance` part of `IType` is updated to reference the final version of the declared class. Crucially, there's no TypeScript way to get the resulting type of a class *after* it has been defined to then start referring to it within an interface that the class implements. Decorators don't let us get a reference to the finished type of a class, nor do they let us return a new type that could reference it, so, we can't mutate the type of a defined class model. Hence, we can't make `IClassModelType` extend `IType` without it capturing a reference to an outdated `Instance` type that doesn't have the methods / properties added after class extension. Sad.
 *
 * Instead, we have this type, and we compute the instance type of a class model in a different way than `IType`. The type of an instance of a class is the class itself. Whereas usually, we need to do:
 *
 * type Instance<T extends IAnyType> = T["InstanceType"];
 *
 * in the case of class models, we can do:
 *
 * type Instance<T extends IClassModelType> = InstanceType<T>;
 *
 * using the `InstanceType` built-in helper type from TypeScript.
 **/
export interface IClassModelType<Props extends ModelProperties, InputType = InputsForModel<InputTypesForModelProps<Props>>, OutputType = OutputTypesForModelProps<Props>> {
    /** @internal */
    readonly [$quickType]: undefined;
    /** @internal */
    readonly [$registered]: true;
    readonly InputType: InputType;
    readonly OutputType: OutputType;
    readonly properties: Props;
    readonly name: string;
    mstType: MSTAnyType;
    /**
     * Create a new class model that extends this class model, but with additional props added to the list of observable props.
     */
    extend<T extends Constructor, SubClassProps extends ModelPropertiesDeclaration>(this: T, subclassProps: SubClassProps): ExtendedClassModel<T, SubClassProps>;
    /** @hidden */
    volatiles: Record<string, VolatileMetadata>;
    /** @hidden */
    snapshottedViews: SnapshottedViewMetadata[];
    /** @hidden */
    instantiate(snapshot: this["InputType"] | undefined, context: TreeContext, parent: IStateTreeNode | null): InstanceType<this>;
    is(value: IAnyStateTreeNode): value is InstanceType<this>;
    is(value: any): value is this["InputType"] | InstanceType<this>;
    /**
     * Create a new observable instance of this class model. Uses MST under the hood.
     */
    create<T extends IAnyType>(this: T, snapshot?: SnapshotIn<T>, env?: any): Instance<T>;
    /**
     * Create a new read-only instance of this class model.
     *
     * Properties and views will work fast on this instance by skipping the observability bits. Actions will throw if called.
     */
    createReadOnly<T extends IAnyType>(this: T, snapshot?: SnapshotIn<T>, env?: any): Instance<T>;
    /** Get a string hash for the schema of this class model */
    schemaHash(): Promise<string>;
    isMQTClassModel: true;
    /**
     * Construct a new readonly instance of this class model.
     **/
    new (...args: any[]): InstanceTypesForModelProps<TypesForModelPropsDeclaration<Props>> & {
        readonly [$type]?: [IClassModelType<Props, InputType>] | [any];
    };
}
export type IAnyClassModelType = IClassModelType<any, any>;
export type IAnyModelType = IAnyNodeModelType | IAnyClassModelType;
export type IMaybeType<T extends IAnyType> = IType<T["InputType"] | undefined, T["OutputType"] | undefined, InstanceWithoutSTNTypeForType<T> | undefined>;
export type IMaybeNullType<T extends IAnyType> = IType<T["InputType"] | null | undefined, T["OutputType"] | null, InstanceWithoutSTNTypeForType<T> | null>;
export type IReferenceType<T extends IAnyComplexType> = IType<string, string, InstanceWithoutSTNTypeForType<T>>;
export type IOptionalType<T extends IAnyType, OptionalValues extends ValidOptionalValue[]> = IType<T["InputType"] | OptionalValues[number], T["OutputType"], InstanceWithoutSTNTypeForType<T>>;
export type IMapType<T extends IAnyType> = IType<Record<string, T["InputType"]> | undefined, Record<string, T["OutputType"]>, IMSTMap<T>>;
export type IArrayType<T extends IAnyType> = IType<Array<T["InputType"]> | undefined, T["OutputType"][], IMSTArray<T>>;
export type IUnionType<Types extends [IAnyType, ...IAnyType[]]> = IType<Types[number]["InputType"], Types[number]["OutputType"], InstanceWithoutSTNTypeForType<Types[number]>>;
export interface IMSTArray<T extends IAnyType> extends Array<Instance<T>> {
    clear(): Instance<T>[];
    push(...items: CreateTypes<T>[]): number;
    concat(...items: (CreateTypes<T> | ConcatArray<CreateTypes<T>>)[]): Instance<T>[];
    remove(value: Instance<T>): boolean;
    replace(newItems: Instance<T>[]): Instance<T>[];
    splice(start: number, deleteCount?: number): Instance<T>[];
    splice(start: number, deleteCount: number, ...items: CreateTypes<T>[]): Instance<T>[];
    spliceWithArray(index: number, deleteCount?: number, newItems?: Instance<T>[]): Instance<T>[];
    toJSON(): Instance<T>[];
    unshift(...items: CreateTypes<T>[]): number;
}
export interface IMSTMap<T extends IAnyType> {
    readonly size: number;
    [Symbol.iterator](): IterableIterator<[string, Instance<T>]>;
    [Symbol.toStringTag]: "Map";
    clear(): void;
    delete(key: string): boolean;
    entries(): IterableIterator<[string, Instance<T>]>;
    forEach(callbackfn: (value: Instance<T>, key: string, map: this) => void, thisArg?: any): void;
    get(key: string): Instance<T> | undefined;
    has(key: string): boolean;
    intercept(handler: IInterceptor<IMapWillChange<string, Instance<T>>>): Lambda;
    keys(): IterableIterator<string>;
    merge(other: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
    observe(listener: (changes: IMapDidChange<string, Instance<T>>) => void, fireImmediately?: boolean): Lambda;
    put(value: CreateTypes<T>): Instance<T>;
    replace(values: IMSTMap<IAnyType> | Record<string, CreateTypes<T>> | any): this;
    set(key: string, value: CreateTypes<T>): this;
    toJSON(): Record<string, SnapshotOut<T>>;
    toString(): string;
    values(): IterableIterator<Instance<T>>;
}
/** @hidden */
export interface TreeContext {
    referenceCache: Map<string, Instance<IAnyNodeModelType>>;
    referencesToResolve: (() => void)[];
    env?: unknown;
}
/**
 * The input type used to create a readonly or observable node from a JSON snapshot.
 * Reflects which properties are required and optional, and accepts input data in the raw JSON form.
 */
export type SnapshotIn<T> = T extends IAnyType ? T["InputType"] : T;
/**
 * The output type retrieved from a readonly or observable node with all the properties in the JSON.
 */
export type SnapshotOut<T> = T extends IAnyType ? T["OutputType"] : T;
/**
 * A readonly or observable node that has been created and is ready for use.
 */
export type Instance<T> = T extends IType<any, any, any> ? T["InstanceType"] : T extends IAnyClassModelType ? InstanceType<T> : T;
export type SnapshotOrInstance<T> = SnapshotIn<T> | Instance<T>;
export type CreateTypes<T extends IAnyType> = T["InputType"] | T["OutputType"] | Instance<T>;
export type ValidOptionalValue = string | boolean | number | null | undefined;
export type IStateTreeNode<T extends IAnyType = IAnyType> = {
    /**
     * The type of this node.
     * At runtime, the type will return an actual type object that was used to create this node
     * At typetime however, the type can be the type that would create this node, or a reference to that type. So, we allow this property to be any to allow assignment of instances created by references to and from instances created by the actual type.
     */
    readonly [$type]?: [T] | [any];
};
export type StateTreeNode<T, IT extends IAnyType> = T extends {
    [$type]?: any;
} ? T : T extends object ? T & IStateTreeNode<IT> : T;
export type IAnyStateTreeNode = StateTreeNode<any, IAnyType>;
/** The incoming properties passed to a types.model() or ClassModel() model factory */
export type ModelPropertiesDeclaration = Record<string, string | number | boolean | Date | IAnyType>;
/** The processed properties describing the shape of a model */
export type ModelProperties = Record<string, IAnyType>;
export type ModelActions = Record<string, Function>;
export type ModelViews = Record<string, unknown>;
export type TypesForModelPropsDeclaration<T extends ModelPropertiesDeclaration> = {
    [K in keyof T]: T[K] extends IAnyType ? T[K] : T[K] extends string ? IOptionalType<ISimpleType<string>, [undefined]> : T[K] extends number ? IOptionalType<ISimpleType<number>, [undefined]> : T[K] extends boolean ? IOptionalType<ISimpleType<boolean>, [undefined]> : IOptionalType<IDateType, [undefined]>;
};
export type InputTypesForModelProps<T extends ModelProperties> = {
    [K in keyof T]: T[K]["InputType"];
};
export type RequiredKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];
export type InputsForModel<T> = {
    [K in RequiredKeys<T>]: T[K];
} & Partial<T>;
export type OutputTypesForModelProps<T extends ModelProperties> = {
    [K in keyof T]: T[K]["OutputType"];
};
export type InstanceTypesForModelProps<T extends ModelProperties> = {
    [K in keyof T]: Instance<T[K]>;
};

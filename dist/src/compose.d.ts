import type { IAnyModelType, IModelType } from "./types";
declare type PropsFromTypes<T> = T extends IModelType<infer P, any> ? P : T extends [IModelType<infer P, any>, ...infer Tail] ? P & PropsFromTypes<Tail> : {};
declare type OthersFromTypes<T> = T extends IModelType<any, infer O> ? O : T extends [IModelType<any, infer O>, ...infer Tail] ? O & OthersFromTypes<Tail> : {};
declare type ComposeFactory = {
    <Types extends [IAnyModelType, ...IAnyModelType[]]>(name: string, ...types: Types): IModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
    <Types extends [IAnyModelType, ...IAnyModelType[]]>(...types: Types): IModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
};
export declare const compose: ComposeFactory;
export {};

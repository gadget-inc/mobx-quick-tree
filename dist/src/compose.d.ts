import type { IAnyNodeModelType, INodeModelType } from "./types";
type PropsFromTypes<T> = T extends INodeModelType<infer P, any> ? P : T extends [INodeModelType<infer P, any>, ...infer Tail] ? P & PropsFromTypes<Tail> : {};
type OthersFromTypes<T> = T extends INodeModelType<any, infer O> ? O : T extends [INodeModelType<any, infer O>, ...infer Tail] ? O & OthersFromTypes<Tail> : {};
type ComposeFactory = {
    <Types extends [IAnyNodeModelType, ...IAnyNodeModelType[]]>(name: string, ...types: Types): INodeModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
    <Types extends [IAnyNodeModelType, ...IAnyNodeModelType[]]>(...types: Types): INodeModelType<PropsFromTypes<Types>, OthersFromTypes<Types>>;
};
export declare const compose: ComposeFactory;
export {};

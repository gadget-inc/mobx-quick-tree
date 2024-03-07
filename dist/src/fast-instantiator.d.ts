import { PropertyMetadata } from "./class-model";
import type { IAnyType, IClassModelType } from "./types";
/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
export declare const buildFastInstantiator: <T extends IClassModelType<Record<string, IAnyType>, any, any>>(model: T) => T;
/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
export declare class FastGetBuilder {
    readonly klass: {
        new (...args: any[]): any;
    };
    memoizableProperties: string[];
    emptyMemoObjectLiteral: string;
    constructor(metadatas: PropertyMetadata[], klass: {
        new (...args: any[]): any;
    });
    buildGetter(property: string, descriptor: PropertyDescriptor): any;
}

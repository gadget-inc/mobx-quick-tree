import type { PropertyMetadata, SnapshottedViewMetadata, ViewMetadata } from "./class-model";
/** Assemble a function for getting the value of a readonly instance very quickly with static dispatch to properties */
export declare class FastGetBuilder {
    readonly klass: {
        new (...args: any[]): any;
    };
    memoizableProperties: string[];
    constructor(metadatas: PropertyMetadata[], klass: {
        new (...args: any[]): any;
    });
    memoSymbolName(property: string): string;
    snapshottedViewInputSymbolName(property: string): string;
    outerClosureStatements(className: string): string;
    buildViewGetter(metadata: ViewMetadata | SnapshottedViewMetadata, descriptor: PropertyDescriptor): any;
}

import type { CachedViewMetadata } from "./class-model";
import type { IAnyType, IClassModelType } from "./types";
/**
 * Compiles a fast class constructor that takes snapshots and turns them into instances of a class model.
 **/
export declare class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
    readonly model: T;
    readonly cachedViews: CachedViewMetadata[];
    aliases: Map<string, string>;
    constructor(model: T, cachedViews: CachedViewMetadata[]);
    build(): T;
    private expressionForDirectlyAssignableType;
    private assignmentExpressionForReferenceType;
    private assignmentExpressionForOptionalType;
    private assignmentExpressionForArrayType;
    private assignmentExpressionForMapType;
    private assignCachedViewExpression;
    alias(expression: string): string;
}

import type { FastGetBuilder } from "./fast-getter";
import type { IAnyType, IClassModelType } from "./types";
/**
 * Compiles a fast class constructor that takes snapshots and turns them into instances of a class model.
 **/
export declare class InstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
    readonly model: T;
    readonly getters: FastGetBuilder;
    aliases: Map<string, string>;
    constructor(model: T, getters: FastGetBuilder);
    build(): T;
    private expressionForDirectlyAssignableType;
    private assignmentExpressionForReferenceType;
    private assignmentExpressionForOptionalType;
    private assignmentExpressionForArrayType;
    private assignmentExpressionForMapType;
    private assignSnapshottedViewExpression;
    alias(expression: string): string;
}

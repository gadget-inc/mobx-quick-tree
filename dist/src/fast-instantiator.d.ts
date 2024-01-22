import type { IAnyType, IClassModelType } from "./types";
/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
export declare const buildFastInstantiator: <T extends IClassModelType<Record<string, IAnyType>, any, any>>(model: T) => T;

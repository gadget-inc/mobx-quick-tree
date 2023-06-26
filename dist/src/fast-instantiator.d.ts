import type { IAnyClassModelType, IAnyType, IClassModelType, Instance, InstantiateContext, SnapshotIn } from "./types";
export declare const $fastInstantiator: unique symbol;
export type CompiledInstantiator<T extends IAnyClassModelType = IAnyClassModelType> = (instance: Instance<T>, snapshot: SnapshotIn<T>, context: InstantiateContext) => void;
/**
 * Compiles a fast function for taking snapshots and turning them into instances of a class model.
 **/
export declare const buildFastInstantiator: <T extends IClassModelType<Record<string, IAnyType>, any, any>>(model: T) => CompiledInstantiator<T>;

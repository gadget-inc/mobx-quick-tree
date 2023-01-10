import type { IAnyType } from "./types";
export declare const late: <T extends IAnyType>(fn: () => T) => T;

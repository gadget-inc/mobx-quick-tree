import { CustomTypeOptions } from "mobx-state-tree";
import type { IType } from "./types";
export declare const custom: <InputType, OutputType>(options: CustomTypeOptions<InputType, OutputType>) => IType<InputType, OutputType, OutputType>;

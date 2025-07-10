import { unpack } from "msgpackr";
import type { IClassModelType, IAnyType } from "./types";

export class MsgpackrInstantiatorBuilder<T extends IClassModelType<Record<string, IAnyType>, any, any>> {
  constructor(readonly model: T) {}

  build(): T & { createReadOnlyFromMsgpack: (buffer: Uint8Array) => InstanceType<T> } {
    const originalModel = this.model;
    const enhancedModel = originalModel as any;

    enhancedModel.createReadOnlyFromMsgpack = function (buffer: Uint8Array) {
      const data = unpack(buffer);
      return originalModel.createReadOnly(data);
    };

    return enhancedModel;
  }

  static createFusedInstantiator<T extends IClassModelType<Record<string, IAnyType>, any, any>>(
    model: T,
  ): T & { createReadOnlyFromMsgpack: (buffer: Uint8Array) => InstanceType<T> } {
    const builder = new MsgpackrInstantiatorBuilder(model);
    return builder.build();
  }
}

export function enableMsgpackrIntegration<T extends IClassModelType<Record<string, IAnyType>, any, any>>(
  model: T,
): T & { createReadOnlyFromMsgpack: (buffer: Uint8Array) => InstanceType<T> } {
  return MsgpackrInstantiatorBuilder.createFusedInstantiator(model);
}

import type { IAnyClassModelType } from "../../src";
import { types } from "../../src";
import { ClassModel, register } from "../../src/class-model";

// eslint-disable-next-line prefer-const
export let State: IAnyClassModelType;
@register
class StateChartState extends ClassModel({
  id: types.identifier,
  childStates: types.array(types.late(() => State)),
  initialChildState: types.maybe(types.reference(types.late(() => State))),
}) {}
State = StateChartState;

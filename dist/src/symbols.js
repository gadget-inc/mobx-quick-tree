"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$notYetMemoized = exports.$volatileDefiner = exports.$registered = exports.$requiresRegistration = exports.$originalDescriptor = exports.$readOnly = exports.$type = exports.$identifier = exports.$parent = exports.$context = exports.$quickType = void 0;
/* */
exports.$quickType = Symbol.for("MQT_quickType");
/* */
exports.$context = Symbol.for("MQT_context");
/* */
exports.$parent = Symbol.for("MQT_parent");
/* */
exports.$identifier = Symbol.for("MQT_identifier");
exports.$type = Symbol.for("MQT_type");
/* */
exports.$readOnly = Symbol.for("MQT_readonly");
/* */
exports.$originalDescriptor = Symbol.for("MQT_originalDescriptor");
/**
 * Set on an type when that type needs to be registered with a decorator before it can be used
 
 **/
exports.$requiresRegistration = Symbol.for("MQT_requiresRegistration");
/**
 * Set on a type when it has been properly registered with a decorator
 
 **/
exports.$registered = Symbol.for("MQT_registered");
/**
 * For tagging functions that define volatiles in the class model API
 *
 
 **/
exports.$volatileDefiner = Symbol.for("MQT_volatileDefiner");
/**
 * The value we use in the memos map when we haven't populated the memo yet
 
 **/
exports.$notYetMemoized = Symbol.for("mqt:not-yet-memoized");

/** @hidden */
export const $quickType = Symbol.for("MQT_quickType");

/** @hidden */
export const $context = Symbol.for("MQT_context");

/** @hidden */
export const $parent = Symbol.for("MQT_parent");

/** @hidden */
export const $identifier = Symbol.for("MQT_identifier");

export const $type = Symbol.for("MQT_type");

/** @hidden */
export const $readOnly = Symbol.for("MQT_readonly");

/** @hidden */
export const $originalDescriptor = Symbol.for("MQT_originalDescriptor");

/**
 * Set on an type when that type needs to be registered with a decorator before it can be used
 * @hidden
 **/
export const $requiresRegistration = Symbol.for("MQT_requiresRegistration");

/**
 * Set on a type when it has been properly registered with a decorator
 * @hidden
 **/
export const $registered = Symbol.for("MQT_registered");

/**
 * For tagging functions that define volatiles in the class model API
 *
 * @hidden
 **/
export const $volatileDefiner = Symbol.for("MQT_volatileDefiner");

/**
 * The value we use in the memos map when we haven't populated the memo yet
 * @hidden
 **/
export const $notYetMemoized = Symbol.for("mqt:not-yet-memoized");

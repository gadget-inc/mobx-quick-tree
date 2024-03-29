/** @hidden */
export const $quickType = Symbol.for("MQT_quickType");

/** @hidden */
export const $context = Symbol.for("MQT_context");

/** @hidden */
export const $parent = Symbol.for("MQT_parent");

/** @hidden */
export const $identifier = Symbol.for("MQT_identifier");

/** @hidden */
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
 * The values of memoized properties on an MQT instance
 * @hidden
 **/
export const $memos = Symbol.for("mqt:class-model-memos");

/**
 * The list of properties which have been memoized
 * @hidden
 **/
export const $memoizedKeys = Symbol.for("mqt:class-model-memoized-keys");

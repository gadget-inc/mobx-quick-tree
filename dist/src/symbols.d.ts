/** @internal */
export declare const $quickType: unique symbol;
/** @internal */
export declare const $context: unique symbol;
/** @internal */
export declare const $parent: unique symbol;
/** @internal */
export declare const $identifier: unique symbol;
export declare const $type: unique symbol;
/** @internal */
export declare const $readOnly: unique symbol;
/** @internal */
export declare const $originalDescriptor: unique symbol;
/**
 * Set on an type when that type needs to be registered with a decorator before it can be used
 * @internal
 **/
export declare const $requiresRegistration: unique symbol;
/**
 * Set on a type when it has been properly registered with a decorator
 * @internal
 **/
export declare const $registered: unique symbol;
/**
 * For tagging functions that define volatiles in the class model API
 *
 * @internal
 **/
export declare const $volatileDefiner: unique symbol;
/**
 * The value we use in the memos map when we haven't populated the memo yet
 * @internal
 **/
export declare const $notYetMemoized: unique symbol;

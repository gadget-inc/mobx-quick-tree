export declare const $quickType: unique symbol;
export declare const $context: unique symbol;
export declare const $parent: unique symbol;
export declare const $identifier: unique symbol;
export declare const $type: unique symbol;
export declare const $readOnly: unique symbol;
export declare const $originalDescriptor: unique symbol;
/**
 * Set on an type when that type needs to be registered with a decorator before it can be used
 
 **/
export declare const $requiresRegistration: unique symbol;
/**
 * Set on a type when it has been properly registered with a decorator
 
 **/
export declare const $registered: unique symbol;
/**
 * For tagging functions that define volatiles in the class model API
 *
 
 **/
export declare const $volatileDefiner: unique symbol;
/**
 * The value we use in the memos map when we haven't populated the memo yet
 
 **/
export declare const $notYetMemoized: unique symbol;

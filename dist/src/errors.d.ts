/** Thrown when an action is invoked on a read-only model instance */
export declare class CantRunActionError extends Error {
}
/** Thrown when an invalid registration is passed to the class model register function */
export declare class RegistrationError extends Error {
}
/** Thrown when a type in a union can't be used for discrimination because the value of the descriminator property can't be determined at runtime */
export declare class InvalidDiscriminatorError extends Error {
}

/** Thrown when an action is invoked on a read-only model instance */
export class CantRunActionError extends Error {}

/** Thrown when an invalid registration is passed to the class model register function */
export class RegistrationError extends Error {}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidDiscriminatorError = exports.RegistrationError = exports.CantRunActionError = void 0;
/** Thrown when an action is invoked on a read-only model instance */
class CantRunActionError extends Error {
}
exports.CantRunActionError = CantRunActionError;
/** Thrown when an invalid registration is passed to the class model register function */
class RegistrationError extends Error {
}
exports.RegistrationError = RegistrationError;
/** Thrown when a type in a union can't be used for discrimination because the value of the descriminator property can't be determined at runtime */
class InvalidDiscriminatorError extends Error {
}
exports.InvalidDiscriminatorError = InvalidDiscriminatorError;

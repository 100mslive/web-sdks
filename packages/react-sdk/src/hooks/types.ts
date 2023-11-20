/**
 * use this to control how errors are handled within a function exposed by a hook. By default this
 * only logs the error to the console, and can be overridden for any other behaviour. For example
 * `(err) => throw err;` will ensure that any error is thrown back to the caller when the function is called.
 */
export type hooksErrHandler = (err: Error, method?: string) => void;

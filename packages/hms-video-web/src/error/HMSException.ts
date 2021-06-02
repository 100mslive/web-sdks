export default class HMSException extends Error {
  readonly code: number;
  name: string;
  action: string;
  message: string;
  description: string;

  constructor(code: number, name: string, action: string, message: string, description: string) {
    super(message);

    // Ref: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HMSException.prototype);
    this.code = code;
    this.name = name;
    this.action = action;
    this.message = message;
    this.description = description;
  }
}

export class HMSHLSException extends Error {
  nativeError?: Error;

  constructor(
    public name: string,
    public message: string,
    public description: string,
    public isTerminal: boolean = false,
  ) {
    super(message);

    // Ref: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HMSHLSException.prototype);
  }

  toAnalyticsProperties() {
    return {
      error_name: this.name,
      error_message: this.message,
      error_description: this.description,
      is_terminal: this.isTerminal,
    };
  }

  addNativeError(error: Error) {
    this.nativeError = error;
  }

  toString() {
    return `{
      name: ${this.name};
      message: ${this.message};
      description: ${this.description};
      isTerminal: ${this.isTerminal};
      nativeError: ${this.nativeError?.message};
    }`;
  }
}

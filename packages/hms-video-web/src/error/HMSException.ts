export interface CodeMessage {
  code: number;
  message: string;
  requiresAction: string;
  requiresErrorInfo: string;
}

export default class HMSException extends Error {
  static Builder = class {
    private readonly code: number;
    private readonly message: string;

    constructor(code: number, message: string) {
      this.code = code;
      this.message = message;
    }

    build(): HMSException {
      return new HMSException(this.code, this.message);
    }
  }

  private code: number;

  private constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }

}
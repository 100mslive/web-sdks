import HMSLogger from '../utils/logger';

export interface CodeMessage {
  code: number;
  message: string;
  requiresAction: string;
  requiresErrorInfo: string;
}

export class HMSExceptionBuilder {
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

export default class HMSException extends Error {
  private code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

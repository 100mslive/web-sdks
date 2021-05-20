import { HMSAction } from './HMSAction';
import HMSErrors, { CodeMessage } from './HMSErrors';

export class HMSExceptionBuilder {
  private readonly cm: CodeMessage;
  private _action: string | null = null;
  private _errorInfo: string | null = null;

  constructor(codeMessage: CodeMessage) {
    this.cm = codeMessage;
  }

  action(action: HMSAction) {
    this._action = HMSAction[action].toString();
    return this;
  }

  errorInfo(errorInfo: string) {
    this._errorInfo = errorInfo;
    return this;
  }

  static from(code: number, message: string, requiresAction: boolean = false, requiresErrorInfo: boolean = false) {
    const cm = {
      code,
      messageTemplate: message,
      requiresAction,
      requiresErrorInfo,
    };
    if (!message.includes('{action}') && requiresAction) {
      cm.messageTemplate = `[{action}] ${cm.messageTemplate}`;
    }

    if (!message.includes('{error_info}') && requiresAction) {
      cm.messageTemplate = `${cm.messageTemplate}. {error_info}`;
    }

    return new HMSExceptionBuilder(cm);
  }

  build(): HMSException {
    const { code, requiresAction, requiresErrorInfo } = this.cm;
    const hmsErrorEntry = Object.entries(HMSErrors).find((errorEntry) => errorEntry[1].code === code);
    const title = (hmsErrorEntry && hmsErrorEntry[0]) || '';
    let message = this.cm.messageTemplate;
    if (requiresAction && this._action === null) {
      throw Error(`${code}: ${message} requires action property`);
    } else if (requiresAction) {
      message = message.replace('{action}', this._action!);
    } else if (this._action !== null) {
      message = `[${this._action}] ${message}`;
    }

    if (requiresErrorInfo && this._errorInfo === null) {
      throw Error(`${code}: ${message} requires errorInfo property`);
    } else if (requiresErrorInfo) {
      message = message.replace('{error_info}', this._errorInfo!);
    } else if (this._errorInfo !== null) {
      message = `${message}. ${this._errorInfo}`;
    }

    return new HMSException(this.cm.code, title, message);
  }
}

export default class HMSException extends Error {
  readonly code: number;
  readonly title: string = '';

  constructor(code: number, title: string, message: string) {
    super(message);

    // Ref: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HMSException.prototype);
    this.name = 'HMSException';
    this.title = title;
    this.code = code;
  }
}

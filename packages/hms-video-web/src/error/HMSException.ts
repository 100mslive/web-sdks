import { IAnalyticsPropertiesProvider } from '../analytics/IAnalyticsPropertiesProvider';
import { HMSAction } from './ErrorFactory';

export class HMSException extends Error implements IAnalyticsPropertiesProvider {
  action: string;
  nativeError?: Error;

  constructor(
    public readonly code: number,
    public name: string,
    action: HMSAction,
    public message: string,
    public description: string,
    public isTerminal: boolean = false,
  ) {
    super(message);

    // Ref: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HMSException.prototype);
    this.action = action.toString();
  }

  toAnalyticsProperties() {
    return {
      name: this.name,
      error_code: this.code,
      error_message: this.message,
      error_description: this.description,
      action: this.action,
      is_terminal: this.isTerminal,
    };
  }

  addNativeError(error: Error) {
    this.nativeError = error;
  }
}

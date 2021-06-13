import { IAnalyticsPropertiesProvider } from '../analytics/IAnalyticsPropertiesProvider';
import { HMSAction } from './ErrorFactory';

export default class HMSException extends Error implements IAnalyticsPropertiesProvider {
  readonly code: number;
  name: string;
  action: string;
  message: string;
  description: string;

  constructor(code: number, name: string, action: HMSAction, message: string, description: string) {
    super(message);

    // Ref: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, HMSException.prototype);
    this.code = code;
    this.name = name;
    this.action = action.toString();
    this.message = message;
    this.description = description;
  }

  toAnalyticsProperties() {
    return {
      error_code: this.code,
      error_message: this.message,
      error_description: this.description,
      action: this.action,
    };
  }
}

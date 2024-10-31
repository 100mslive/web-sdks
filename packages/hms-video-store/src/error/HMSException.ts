import { HMSAction } from './HMSAction';
import { IAnalyticsPropertiesProvider } from '../analytics/IAnalyticsPropertiesProvider';
import { HMSTrackExceptionType } from '../media/tracks/HMSTrackExceptionType';
import { HMSSignalMethod } from '../signal/jsonrpc/models';

export class HMSException extends Error implements IAnalyticsPropertiesProvider {
  action: string;
  nativeError?: Error;

  constructor(
    public readonly code: number,
    public name: string,
    action: HMSAction | HMSSignalMethod,
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
      error_name: this.name,
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

  toString() {
    return `{
        code: ${this.code};
        name: ${this.name};
        action: ${this.action};
        message: ${this.message};
        description: ${this.description};
        isTerminal: ${this.isTerminal};
        nativeError: ${this.nativeError?.message};
      }`;
  }
}

export class HMSTrackException extends HMSException {
  constructor(
    code: number,
    name: string,
    action: HMSAction | HMSSignalMethod,
    message: string,
    description: string,
    public trackType: HMSTrackExceptionType,
  ) {
    super(code, name, action, message, description, false);
  }

  toAnalyticsProperties() {
    return {
      ...super.toAnalyticsProperties(),
      track_type: this.trackType,
    };
  }

  toString() {
    return `{
        code: ${this.code};
        name: ${this.name};
        action: ${this.action};
        message: ${this.message};
        description: ${this.description};
        isTerminal: ${this.isTerminal};
        nativeError: ${this.nativeError?.message};
        trackType: ${this.trackType};
      }`;
  }
}

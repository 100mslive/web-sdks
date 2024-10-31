import { HMSAction } from './HMSAction';
import { HMSException } from './HMSException';
import { HMSTrackExceptionTrackType } from '../media/tracks/HMSTrackExceptionTrackType';
import { HMSSignalMethod } from '../signal/jsonrpc/models';

export class HMSTrackException extends HMSException {
  constructor(
    public readonly code: number,
    public name: string,
    action: HMSAction | HMSSignalMethod,
    public message: string,
    public description: string,
    public trackType: HMSTrackExceptionTrackType,
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

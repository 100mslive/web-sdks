import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import { HMSDeviceChangeEvent } from '../interfaces';
import { HMSEvents } from '../utils/constants';
import { HMSInternalEvent } from './HMSInternalEvent';

export class EventBus {
  private eventEmitter: EventEmitter = new EventEmitter();
  readonly deviceChange = new HMSInternalEvent<HMSDeviceChangeEvent>(HMSEvents.DEVICE_CHANGE, this.eventEmitter);
  readonly localAudioEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_AUDIO_ENABLED, this.eventEmitter);
  readonly localVideoEnabled = new HMSInternalEvent<boolean>(HMSEvents.LOCAL_VIDEO_ENABLED, this.eventEmitter);
}

import { LocalStorageEvents } from './LocalStoageEvents';
import { ISignal } from '../../signal/ISignal';
import { AnalyticsTransport } from '../AnalyticsTransport';

export class SignalAnalyticsTransport extends AnalyticsTransport {
  failedEvents = new LocalStorageEvents();

  constructor(public transportProvider: ISignal) {
    super();
  }
}

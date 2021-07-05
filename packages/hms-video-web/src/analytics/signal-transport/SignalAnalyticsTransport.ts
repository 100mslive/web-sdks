import { ISignal } from '../../signal/ISignal';
import { AnalyticsTransport } from '../AnalyticsTransport';
import { LocalStorageEvents } from './LocalStoageEvents';

export class SignalAnalyticsTransport extends AnalyticsTransport {
  failedEvents = new LocalStorageEvents();

  constructor(public transportProvider: ISignal) {
    super();
  }
}

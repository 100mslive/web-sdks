import { LocalStorageEvents } from './LocalStoageEvents';
import JsonRpcSignal from '../../signal/jsonrpc';
import { AnalyticsTransport } from '../AnalyticsTransport';

export class SignalAnalyticsTransport extends AnalyticsTransport {
  failedEvents = new LocalStorageEvents();

  constructor(public transportProvider: JsonRpcSignal) {
    super();
  }
}

/**
 * Minimal HMSTransport instantiator for unit tests.
 *
 * Builds a real `HMSTransport` with the smallest mocks that get past the
 * constructor and its initial subscriptions. Tests can then call
 * private/arrow-field methods directly on the instance:
 *
 *   const t = makeTransport();
 *   await (t as any).retrySignalDisconnectTask();
 *
 * For tests that exercise specific code paths, override fields after
 * construction:
 *
 *   (t as any).joinParameters = undefined;
 *   (t as any).signal = mySignalMock;
 *
 * This is deliberately not a "fake biz" or full integration harness —
 * it's the smallest scaffolding that lets us exercise the real
 * HMSTransport methods with controlled inputs.
 */

import { AnalyticsEventsService } from '../../analytics/AnalyticsEventsService';
import { AnalyticsTimer } from '../../analytics/AnalyticsTimer';
import { PluginUsageTracker } from '../../common/PluginUsageTracker';
import { DeviceManager } from '../../device-manager';
import { EventBus } from '../../events/EventBus';
import { Store } from '../../sdk/store';
import HMSTransport from '../../transport';
import ITransportObserver from '../../transport/ITransportObserver';
import { TransportState } from '../../transport/models/TransportState';

export const makeFakeObserver = (): ITransportObserver => ({
  onNotification: jest.fn(),
  onConnected: jest.fn(),
  onTrackAdd: jest.fn(),
  onTrackRemove: jest.fn(),
  onFailure: jest.fn(),
  onStateChange: jest.fn(async () => {}),
});

export interface MakeTransportOptions {
  observer?: ITransportObserver;
  store?: Partial<Store>;
}

export const makeTransport = (opts: MakeTransportOptions = {}) => {
  const observer = opts.observer ?? makeFakeObserver();
  const eventBus = new EventBus();
  const store = (opts.store as Store) ?? new Store();
  const analyticsTimer = new AnalyticsTimer();
  const analyticsEventsService = new AnalyticsEventsService(store);
  const pluginUsageTracker = new PluginUsageTracker(eventBus);
  const deviceManager = new DeviceManager(store, eventBus);

  const transport = new HMSTransport(
    observer,
    deviceManager,
    store,
    eventBus,
    analyticsEventsService,
    analyticsTimer,
    pluginUsageTracker,
  );

  return { transport, observer, eventBus, store, analyticsTimer, deviceManager };
};

export { TransportState };

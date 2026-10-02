import { VideoPluginsAnalytics } from './VideoPluginsAnalytics';
import { EventBus } from '../../events/EventBus';

describe('VideoPluginsAnalytics', () => {
  let eventBus: EventBus;
  let analytics: VideoPluginsAnalytics;
  let statsProperties: () => Record<string, any> | undefined;

  beforeEach(() => {
    eventBus = new EventBus();
    analytics = new VideoPluginsAnalytics(eventBus);
    const events: any[] = [];
    eventBus.analytics.subscribe(event => events.push(event));
    statsProperties = () => events.find(event => event.name === 'mediaPlugin.stats')?.properties;
  });

  it('reports a finite pre-processing average when no frame was pre-processed', () => {
    analytics.added('plugin');
    analytics.removed('plugin');
    expect(statsProperties()?.avg_preprocessing_time).toBe(0);
  });

  it('reports a finite processing average when no frame was processed', () => {
    analytics.added('plugin');
    analytics.removed('plugin');
    expect(statsProperties()?.avg_processing_time).toBe(0);
  });

  it('counts frames that took under a millisecond in the processing average', async () => {
    let now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    analytics.added('plugin');
    await analytics.processWithTime('plugin', async () => {
      now += 4;
    });
    await analytics.processWithTime('plugin', async () => {
      now += 0;
    });
    analytics.removed('plugin');
    jest.restoreAllMocks();
    expect(statsProperties()?.avg_processing_time).toBe(2);
  });
});

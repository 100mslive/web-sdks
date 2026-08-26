import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import { VideoElementManager } from './VideoElementManager';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces/simulcast-layers';
import HMSLogger from '../../utils/logger';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

const makeRemoteVideoTrack = () => {
  const sendOverApiDataChannelWithResponse = jest.fn();
  const connection = { sendOverApiDataChannelWithResponse } as unknown as HMSSubscribeConnection;
  const stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
  const nativeTrack = {
    id: 'track-1',
    kind: 'video',
    enabled: true,
    getSettings: jest.fn(() => ({})),
    addEventListener: jest.fn(),
  } as unknown as MediaStreamTrack;
  return new HMSRemoteVideoTrack(stream, nativeTrack, 'regular');
};

describe('VideoElementManager handlers fire after cleanup()', () => {
  it('handleIntersection is a no-op after cleanup() — does not call addSink', async () => {
    const track = makeRemoteVideoTrack();
    const addSinkSpy = jest.spyOn(track, 'addSink').mockResolvedValue(undefined as any);
    const removeSinkSpy = jest.spyOn(track, 'removeSink').mockResolvedValue(undefined as any);

    const manager = new VideoElementManager(track);
    const elem = document.createElement('video');
    await manager.addVideoElement(elem);

    manager.cleanup();
    addSinkSpy.mockClear();
    removeSinkSpy.mockClear();

    const handleIntersection = (manager as any).handleIntersection;
    await handleIntersection({
      target: elem,
      isIntersecting: true,
      boundingClientRect: { width: 640, height: 360 },
    } as unknown as IntersectionObserverEntry);

    expect(addSinkSpy).not.toHaveBeenCalled();
    expect(removeSinkSpy).not.toHaveBeenCalled();
  });
});

interface ObserverHandlers {
  handleIntersection: (entry: IntersectionObserverEntry) => Promise<void>;
}

const handlersOf = (manager: VideoElementManager) => manager as unknown as ObserverHandlers;

/**
 * handleIntersection stamps each entry so a stale add loses to a newer one for the same element.
 * Detaching the element is the other way an add becomes stale, and it does not go through that
 * stamp - React unmounting a tile, or the track being cleaned up, while an add is suspended on its
 * layer request. The add then resumes against an element nobody is rendering any more.
 */
describe('VideoElementManager teardown while an add is in flight', () => {
  let track: HMSRemoteVideoTrack;
  let manager: VideoElementManager;
  let videoElement: HTMLVideoElement;
  let sent: HMSSimulcastLayer[];
  let realMediaStream: typeof MediaStream;

  const settle = () => new Promise(resolve => setTimeout(resolve, 50));

  beforeEach(() => {
    sent = [];
    videoElement = document.createElement('video');
    document.body.appendChild(videoElement);
    realMediaStream = window.MediaStream;
    window.MediaStream = jest.fn().mockImplementation(() => ({ addTrack: jest.fn() })) as unknown as typeof MediaStream;
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    jest.spyOn(HMSLogger, 'e').mockImplementation(() => undefined);

    const send = jest.fn().mockImplementation(({ params }) => {
      sent.push(params.max_spatial_layer);
      return new Promise(resolve => setTimeout(() => resolve({}), 5));
    });
    const connection = { sendOverApiDataChannelWithResponse: send } as unknown as HMSSubscribeConnection;
    const stream = new HMSRemoteStream({ id: 'stream-1' } as MediaStream, connection);
    const nativeTrack = {
      id: 'track-1',
      kind: 'video',
      enabled: true,
      addEventListener: jest.fn(),
    } as unknown as MediaStreamTrack;
    track = new HMSRemoteVideoTrack(stream, nativeTrack, 'regular');
    manager = track.videoHandler;
    manager.addVideoElement(videoElement);
  });

  afterEach(() => {
    manager.cleanup();
    videoElement.remove();
    // a direct assignment, so restoreAllMocks cannot put the real one back
    window.MediaStream = realMediaStream;
    jest.restoreAllMocks();
  });

  const entry = () =>
    ({
      target: videoElement,
      isIntersecting: true,
      boundingClientRect: { width: 640, height: 360 },
    } as unknown as IntersectionObserverEntry);

  /** React unmounting the tile while the add is still waiting on its layer request. */
  it('does not attach the element when it is removed mid-add', async () => {
    handlersOf(manager).handleIntersection(entry());
    manager.removeVideoElement(videoElement);
    await settle();

    expect(videoElement.srcObject).toBeNull();
  });

  it('does not ask the SFU to keep streaming to an element that was removed mid-add', async () => {
    handlersOf(manager).handleIntersection(entry());
    manager.removeVideoElement(videoElement);
    await settle();

    expect(sent).not.toContain(HMSSimulcastLayer.HIGH);
    expect(track.getLayer()).toBe(HMSSimulcastLayer.NONE);
  });

  /** The track being cleaned up - leave, or the peer being removed - during the same window. */
  it('does not attach the element when the manager is cleaned up mid-add', async () => {
    handlersOf(manager).handleIntersection(entry());
    manager.cleanup();
    await settle();

    expect(videoElement.srcObject).toBeNull();
  });

  /** The add still has to work when nothing tears the element down. */
  it('attaches the element when it survives the add', async () => {
    handlersOf(manager).handleIntersection(entry());
    await settle();

    expect(videoElement.srcObject).not.toBeNull();
  });

  /**
   * The layer the SFU is asked for is the max across live tiles. A tile that pinned it to HIGH and
   * was then unmounted leaves preferredLayer at HIGH, and updateLayer('removeSink') sees the target
   * already current and sends nothing - so the SFU keeps streaming HIGH for a tile that is gone.
   */
  it('drops the preferred layer back when the tile that raised it is removed', async () => {
    // without definitions getClosestLayer always answers HIGH, so the two tiles would be
    // indistinguishable and the test could not fail
    track.setSimulcastDefinitons([
      { layer: HMSSimulcastLayer.LOW, resolution: { width: 160, height: 90 } },
      { layer: HMSSimulcastLayer.MEDIUM, resolution: { width: 320, height: 180 } },
      { layer: HMSSimulcastLayer.HIGH, resolution: { width: 640, height: 360 } },
    ]);
    const small = document.createElement('video');
    document.body.appendChild(small);
    manager.addVideoElement(small);
    // the small tile is what remains, and it only needs a low layer
    handlersOf(manager).handleIntersection({
      target: small,
      isIntersecting: true,
      boundingClientRect: { width: 160, height: 90 },
    } as unknown as IntersectionObserverEntry);
    await settle();

    // a big tile scrolls in and pins the layer high, then unmounts
    handlersOf(manager).handleIntersection(entry());
    await settle();
    expect(track.getPreferredLayer()).toBe(HMSSimulcastLayer.HIGH);

    manager.removeVideoElement(videoElement);
    await settle();

    expect(track.getPreferredLayer()).not.toBe(HMSSimulcastLayer.HIGH);
    small.remove();
  });

  /** a resize entry for an element already torn down must not drive a layer request */
  it('ignores a resize for an element that is no longer registered', async () => {
    handlersOf(manager).handleIntersection(entry());
    await settle();
    manager.removeVideoElement(videoElement);
    await settle();
    sent.length = 0;

    await (manager as unknown as { handleResize: (e: ResizeObserverEntry) => Promise<void> }).handleResize({
      target: videoElement,
      contentRect: { width: 1280, height: 720 },
    } as unknown as ResizeObserverEntry);
    await settle();

    expect(sent).toEqual([]);
  });

  /**
   * One track, N elements: sinkCount is a count on the track (not a set), videoElements is the
   * manager's registry, and intersectionSeq stamps each element separately from one global
   * counter. selectMaxLayer then asks the SFU for a single layer - the max across live tiles - so
   * the largest tile decides quality and every element renders the same stream.
   */
  describe('one track attached to several elements', () => {
    let second: HTMLVideoElement;

    beforeEach(async () => {
      second = document.createElement('video');
      document.body.appendChild(second);
      manager.addVideoElement(second);
      handlersOf(manager).handleIntersection(entry());
      handlersOf(manager).handleIntersection({
        target: second,
        isIntersecting: true,
        boundingClientRect: { width: 320, height: 180 },
      } as unknown as IntersectionObserverEntry);
      await settle();
    });

    afterEach(() => second.remove());

    it('attaches the stream to every element', () => {
      expect(videoElement.srcObject).not.toBeNull();
      expect(second.srcObject).not.toBeNull();
    });

    /**
     * detach must be synchronous. detachVideo/attachVideo run back to back when a tile swaps
     * tracks (PIPManager, useVideo on track change): if the old track's removeSink is queued
     * behind a layer request, it lands after the new stream is attached and nulls it.
     */
    it('detaches the element synchronously, before any layer request', () => {
      manager.removeVideoElement(videoElement);

      expect(videoElement.srcObject).toBeNull();
    });

    it('does not null a stream attached to the same element after the removal', async () => {
      manager.removeVideoElement(videoElement);
      // the element is immediately reused for another track's stream
      const replacement = new MediaStream();
      videoElement.srcObject = replacement;
      await settle();

      expect(videoElement.srcObject).toBe(replacement);
    });

    it('leaves the surviving element attached when the other is removed', async () => {
      manager.removeVideoElement(videoElement);
      await settle();

      expect(videoElement.srcObject).toBeNull();
      expect(second.srcObject).not.toBeNull();
    });

    it('does not tell the SFU to stop sending while one element still renders', async () => {
      manager.removeVideoElement(videoElement);
      await settle();

      expect(sent[sent.length - 1]).not.toBe(HMSSimulcastLayer.NONE);
      expect(track.getLayer()).not.toBe(HMSSimulcastLayer.NONE);
    });

    it('stops the stream only once the last element is removed', async () => {
      manager.removeVideoElement(videoElement);
      await settle();
      manager.removeVideoElement(second);
      await settle();

      expect(track.getLayer()).toBe(HMSSimulcastLayer.NONE);
    });

    /** the stamp is per element, so one element's churn must not cancel another's pending add */
    it('does not let one element`s intersection churn cancel another`s add', async () => {
      second.srcObject = null;
      // second scrolls in; videoElement then churns, bumping only its own stamp
      handlersOf(manager).handleIntersection({
        target: second,
        isIntersecting: true,
        boundingClientRect: { width: 320, height: 180 },
      } as unknown as IntersectionObserverEntry);
      handlersOf(manager).handleIntersection(entry());
      handlersOf(manager).handleIntersection(entry());
      await settle();

      expect(second.srcObject).not.toBeNull();
    });
  });
});

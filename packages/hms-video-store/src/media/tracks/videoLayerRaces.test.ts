import { HMSRemoteVideoTrack } from './HMSRemoteVideoTrack';
import type { VideoElementManager } from './VideoElementManager';
import HMSSubscribeConnection from '../../connection/subscribe/subscribeConnection';
import { HMSSimulcastLayer } from '../../interfaces/simulcast-layers';
import HMSLogger from '../../utils/logger';
import { HMSRemoteStream } from '../streams/HMSRemoteStream';

/**
 * The observer callbacks are private, but they are the entry point the observers actually use -
 * neither awaits the promise it gets back, so a second entry arrives while the first is still
 * waiting on its layer request.
 */
interface ObserverHandlers {
  handleIntersection: (entry: IntersectionObserverEntry) => Promise<void>;
}

const handlersOf = (manager: VideoElementManager) => manager as unknown as ObserverHandlers;

/**
 * Nothing awaits addSink/removeSink, so a quick scroll in/out or a remote peer mashing their
 * camera button leaves two layer requests overlapping. What must hold is that the request the SFU
 * sees last matches what the user ended on - an add landing after a remove keeps the SFU sending a
 * stream nothing renders, and a remove landing after an add leaves a blank tile.
 */
describe('VideoElementManager layer request races', () => {
  let track: HMSRemoteVideoTrack;
  let manager: VideoElementManager;
  let videoElement: HTMLVideoElement;
  let sent: HMSSimulcastLayer[];
  let send: jest.Mock;

  /**
   * Responses resolve on a later task, so a request made while another is in flight genuinely
   * overlaps it. Waiting longer than that lets every pending chain finish before asserting.
   */
  const settle = () => new Promise(resolve => setTimeout(resolve, 50));

  /** Just enough to let updateSinks run for one setEnabled, while its response is still in flight. */
  const tick = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    sent = [];
    videoElement = document.createElement('video');
    // handleIntersection treats a detached element as always-visible, so the remove branch is only
    // reachable once the element is in the document.
    document.body.appendChild(videoElement);
    window.MediaStream = jest.fn().mockImplementation(() => ({ addTrack: jest.fn() })) as unknown as typeof MediaStream;
    jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    jest.spyOn(HMSLogger, 'e').mockImplementation(() => undefined);

    send = jest.fn().mockImplementation(({ params }) => {
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
    // the track builds its own VideoElementManager and setEnabled drives that one - a manager
    // constructed here would never be the one updateSinks runs against.
    manager = track.videoHandler;
    manager.addVideoElement(videoElement);
  });

  afterEach(() => {
    manager.cleanup();
    videoElement.remove();
    jest.restoreAllMocks();
  });

  const entry = (isIntersecting: boolean) =>
    ({
      target: videoElement,
      isIntersecting,
      boundingClientRect: { width: 640, height: 360 },
    } as unknown as IntersectionObserverEntry);

  /**
   * Known gap, unchanged by the swallow and identical on main: scrolling a tile in and straight
   * back out leaves the SFU on high. The add suspends on selectMaxLayer before it attaches a sink,
   * so the remove that follows sees hasSinks() false and a layer still on none, decides there is
   * nothing to say, and returns - then the add resumes and asks for high. The SFU keeps sending a
   * stream no element renders.
   *
   * it.failing so this flips red the day the ordering is fixed, rather than asserting the bug.
   */
  it.failing('leaves the SFU on none when a tile is scrolled in and straight back out', async () => {
    handlersOf(manager).handleIntersection(entry(true));
    handlersOf(manager).handleIntersection(entry(false));
    await settle();

    expect(sent[sent.length - 1]).toBe(HMSSimulcastLayer.NONE);
    expect(track.getLayer()).toBe(HMSSimulcastLayer.NONE);
  });

  /**
   * The reverse - out then straight back in. The add is what the user ended on, so the element must
   * be attached and the SFU left on a real layer.
   */
  it('leaves the tile attached when it is scrolled out and straight back in', async () => {
    handlersOf(manager).handleIntersection(entry(false));
    handlersOf(manager).handleIntersection(entry(true));
    await settle();

    expect(sent[sent.length - 1]).not.toBe(HMSSimulcastLayer.NONE);
    expect(track.getLayer()).not.toBe(HMSSimulcastLayer.NONE);
    expect(videoElement.srcObject).not.toBeNull();
  });

  /**
   * A remote peer toggling their camera. setEnabled runs updateSinks, which fires addSink or
   * removeSink and discards the promise, so a quick mute/unmute overlaps two layer requests.
   */
  it('ends on a real layer when a remote peer mutes and unmutes quickly', async () => {
    await handlersOf(manager).handleIntersection(entry(true));
    await settle();
    sent.length = 0;

    track.setEnabled(false);
    track.setEnabled(true);
    await settle();

    expect(track.getLayer()).not.toBe(HMSSimulcastLayer.NONE);
    expect(videoElement.srcObject).not.toBeNull();
  });

  /**
   * The mirror of the above - unmute then mute. The SFU must end on none so it stops sending a
   * stream for a peer whose camera is off.
   */
  it('ends on none when a remote peer unmutes and mutes quickly', async () => {
    await handlersOf(manager).handleIntersection(entry(true));
    await track.setEnabled(false);
    await settle();
    sent.length = 0;

    track.setEnabled(true);
    track.setEnabled(false);
    await settle();

    expect(track.getLayer()).toBe(HMSSimulcastLayer.NONE);
  });

  /**
   * Toggling back before updateSinks has run coalesces to nothing rather than sending a redundant
   * pair - the second updateSinks sees the layer the first one already asked for.
   */
  it('coalesces a mute and unmute that land in the same tick', async () => {
    await handlersOf(manager).handleIntersection(entry(true));
    await settle();
    sent.length = 0;

    track.setEnabled(false);
    track.setEnabled(true);
    await settle();

    expect(sent).toEqual([]);
    expect(track.getLayer()).toBe(HMSSimulcastLayer.HIGH);
    expect(videoElement.srcObject).not.toBeNull();
  });

  /**
   * Once the mute's request is on the wire, the unmute's has to follow it in that order - the send
   * happens before the response is awaited, so a slow first response cannot let the second overtake
   * it.
   */
  it('sends overlapping requests in the order they were made', async () => {
    await handlersOf(manager).handleIntersection(entry(true));
    await settle();
    sent.length = 0;

    track.setEnabled(false);
    await tick();
    track.setEnabled(true);
    await settle();

    expect(sent).toEqual([HMSSimulcastLayer.NONE, HMSSimulcastLayer.HIGH]);
  });

  /**
   * A failing request must not swallow the one that follows it, and must not reject out of
   * setEnabled - updateSinks discards the promise, so nothing downstream would catch it.
   */
  it('still sends the later request when the earlier one fails', async () => {
    await handlersOf(manager).handleIntersection(entry(true));
    await settle();
    sent.length = 0;
    send.mockImplementationOnce(({ params }) => {
      sent.push(params.max_spatial_layer);
      return Promise.reject(new Error('No response from SFU for prefer-video-track-state'));
    });

    const muted = track.setEnabled(false);
    await tick();
    const unmuted = track.setEnabled(true);
    await settle();

    await expect(Promise.all([muted, unmuted])).resolves.toBeDefined();
    expect(sent).toEqual([HMSSimulcastLayer.NONE, HMSSimulcastLayer.HIGH]);
    expect(videoElement.srcObject).not.toBeNull();
  });
});

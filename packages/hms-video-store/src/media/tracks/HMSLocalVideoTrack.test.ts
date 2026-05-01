import { HMSLocalVideoTrack } from './HMSLocalVideoTrack';
import HMSPublishConnection from '../../connection/publish/publishConnection';
import { EventBus } from '../../events/EventBus';
import { HMSVideoTrackSettings, HMSVideoTrackSettingsBuilder } from '../settings';
import { HMSLocalStream } from '../streams/HMSLocalStream';

const streamId = 'stream-1';
const trackId = 'track-1';

const makeLocalVideoTrack = () => {
  const nativeStream = { id: streamId, getTracks: () => [] } as unknown as MediaStream;
  const stream = new HMSLocalStream(nativeStream);
  stream.setConnection({} as unknown as HMSPublishConnection);
  const nativeTrack = {
    id: trackId,
    kind: 'video',
    enabled: true,
    getSettings: jest.fn(() => ({})),
    addEventListener: jest.fn(),
  } as unknown as MediaStreamTrack;
  const settings = new HMSVideoTrackSettingsBuilder().build();
  return new HMSLocalVideoTrack(stream, nativeTrack, 'regular', new EventBus(), settings);
};

describe('HMSLocalVideoTrack', () => {
  describe('removeOrReplaceProcessedTrack', () => {
    it('stops the previous processedTrack before overwriting with a new one', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const oldProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;
      const newProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;

      (track as any).processedTrack = oldProcessed;
      await (track as any).removeOrReplaceProcessedTrack(newProcessed);

      expect(oldProcessed.stop).toHaveBeenCalledTimes(1);
      expect(newProcessed.stop).not.toHaveBeenCalled();
      expect((track as any).processedTrack).toBe(newProcessed);
    });

    it('stops the previous processedTrack when reset to undefined', async () => {
      const track = makeLocalVideoTrack();
      jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const oldProcessed = { stop: jest.fn() } as unknown as MediaStreamTrack;
      (track as any).processedTrack = oldProcessed;

      await (track as any).removeOrReplaceProcessedTrack(undefined);

      expect(oldProcessed.stop).toHaveBeenCalledTimes(1);
      expect((track as any).processedTrack).toBeUndefined();
    });

    it('is a no-op when processedTrack is the same instance', async () => {
      const track = makeLocalVideoTrack();
      const replaceSpy = jest.spyOn(track as any, 'replaceSenderTrack').mockResolvedValue(undefined);

      const same = { stop: jest.fn() } as unknown as MediaStreamTrack;
      (track as any).processedTrack = same;

      await (track as any).removeOrReplaceProcessedTrack(same);

      expect(same.stop).not.toHaveBeenCalled();
      expect((track as any).processedTrack).toBe(same);
      expect(replaceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleDeviceChange', () => {
    it('does not mutate the caller-supplied settings object', async () => {
      const track = makeLocalVideoTrack();

      jest.spyOn(track as any, 'replaceTrackWith').mockResolvedValue({
        getSettings: jest.fn(() => ({ deviceId: 'new-device' })),
      } as unknown as MediaStreamTrack);
      jest.spyOn(track as any, 'replaceSender').mockResolvedValue(undefined);
      jest.spyOn(track as any, 'processPlugins').mockResolvedValue(undefined);
      jest.spyOn(track['videoHandler'], 'updateSinks').mockReturnValue(undefined as any);

      const inputSettings = {
        ...track.settings,
        deviceId: 'new-device',
        facingMode: 'user',
      } as unknown as HMSVideoTrackSettings;
      const beforeFacingMode = inputSettings.facingMode;

      await (track as any).handleDeviceChange(inputSettings, false);

      // The fix copies the settings object before stripping facingMode for
      // replaceTrackWith. The caller's reference must not be mutated.
      expect(inputSettings.facingMode).toBe(beforeFacingMode);
    });
  });
});

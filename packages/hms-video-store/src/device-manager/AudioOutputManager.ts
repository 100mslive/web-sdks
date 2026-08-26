import { DeviceManager } from './DeviceManager';
import { AudioSinkManager } from '../audio-sink-manager';
import HMSLogger from '../utils/logger';
import { HMSAudioContextHandler } from '../utils/media';

export interface IAudioOutputManager {
  getDevice(): MediaDeviceInfo | undefined;
  setDevice(deviceId: string): Promise<MediaDeviceInfo | undefined>;
  getVolume(): number;
  setVolume(value: number): Promise<void>;
}

export class AudioOutputManager implements IAudioOutputManager {
  constructor(private deviceManager: DeviceManager, private audioSinkManager: AudioSinkManager) {}

  getVolume() {
    return this.audioSinkManager.getVolume();
  }

  setVolume(value: number) {
    // not `< 0 || > 100`: NaN passes that, and the element setter then throws on every later
    // track add. Returned, not dropped - HMSSDKActions awaits this, and a dropped promise makes
    // the sink's own rejection an unhandled one.
    if (!(value >= 0 && value <= 100)) {
      return Promise.reject(Error('Please pass a valid number between 0-100'));
    }
    return this.audioSinkManager.setVolume(value);
  }

  getDevice() {
    return this.deviceManager.outputDevice;
  }

  async setDevice(deviceId?: string) {
    HMSLogger.d('[AudioOutputManager]', 'setDevice requested', deviceId);
    const newDevice = await this.deviceManager.updateOutputDevice(deviceId, true);
    HMSLogger.d(
      '[AudioOutputManager]',
      'setDevice result',
      `{
        requested: ${deviceId};
        applied: ${newDevice?.label};
        appliedId: ${newDevice?.deviceId};
      }`,
    );
    if (newDevice) {
      // If any remote audio tracks were auto-paused by an OS audio-session
      // interruption (headset pull / incoming call / Bluetooth swap), the user
      // is almost certainly picking a new speaker to recover playback. The
      // eventBus.deviceChange subscription guards `isUserSelection` out, so
      // unpauseAudioTracks never fires from this path otherwise. See LIV-254.
      //
      // Best-effort: the device selection itself has already succeeded, so
      // don't reject setDevice if recovery fails (e.g. autoplay still blocked).
      try {
        await this.unblockAutoplay();
      } catch (err) {
        HMSLogger.w('[AudioOutputManager]', 'unblockAutoplay failed after setDevice', err);
      }
    }
    return newDevice;
  }

  async unblockAutoplay() {
    await this.audioSinkManager.unblockAutoplay();
    /**
     * similar to autoplay error when there's no user interaction,
     * audio context is paused due to which empty audio tracks do not send any data and therefore it doesn't reach SFU.
     * resume audio context on user interaction to enable empty audio tracks to send data and be forwarded to remote peers
     */
    await HMSAudioContextHandler.resumeContext();
  }
}

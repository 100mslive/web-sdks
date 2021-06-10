export default interface HMSDeviceManager {
  audioInput: InputDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  videoInput: InputDeviceInfo[];

  selected: {
    audioInput: InputDeviceInfo;
    audioOutput: MediaDeviceInfo;
    videoInput: InputDeviceInfo;
  };
}

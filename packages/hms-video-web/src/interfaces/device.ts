export default interface HMSDevice {
  videoInputs: HMSVideoDevice[];
  videoOutputs: HMSVideoDevice[];
  audioInputs: HMSAudioDevice[];
  audioOutputs: HMSAudioDevice[];
}

type HMSVideoDevice = HMSDevice;

type HMSAudioDevice = HMSDevice;

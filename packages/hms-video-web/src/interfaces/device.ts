export default interface HMSDevice {
  videoInputs: HMSVideoDevice[];
  videoOutputs: HMSVideoDevice[];
  audioInputs: HMSAudioDevice[];
  audioOutputs: HMSAudioDevice[];
}

interface HMSVideoDevice extends HMSDevice {}

interface HMSAudioDevice extends HMSDevice {}

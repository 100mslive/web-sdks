export default interface HMSDevice {
  videoInputs: IHMSVideoDevice[];
  videoOutputs: IHMSVideoDevice[];
  audioInputs: IHMSAudioDevice[];
  audioOutputs: IHMSAudioDevice[];
}

interface IHMSVideoDevice extends HMSDevice {}

interface IHMSAudioDevice extends HMSDevice {}

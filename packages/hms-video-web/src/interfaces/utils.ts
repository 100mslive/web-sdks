export interface IHMSDevice {
  videoInputs: IHMSVideoDevice[];
  videoOutputs: IHMSVideoDevice[];
  audioInputs: IHMSAudioDevice[];
  audioOutputs: IHMSAudioDevice[];
}

interface IHMSVideoDevice extends IHMSDevice {}

interface IHMSAudioDevice extends IHMSDevice {}

export interface IHMSUtils {
  getDevices(): IHMSDevice[];
}

export interface IHMSDevice {
  videoInputs: IHMSVideoDevice[];
  videoOutputs: IHMSVideoDevice[];
  audioInputs: IHMSAudioDevice[];
  audioOutputs: IHMSAudioDevice[];
}

type IHMSVideoDevice = IHMSDevice;

type IHMSAudioDevice = IHMSDevice;

export interface IHMSUtils {
  getDevices(): IHMSDevice[];
}

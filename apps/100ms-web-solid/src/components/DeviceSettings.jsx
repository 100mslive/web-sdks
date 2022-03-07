// @ts-check
import { useDevices, DeviceType } from '@100mslive/solid-sdk';

const DeviceSettings = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput, audioOutput } = allDevices;
  return (
    <div>
      <h1>Device Settings</h1>
      <Select
        title="Camera"
        value={selectedDeviceIDs.videoInput}
        list={videoInput}
        onChange={e =>
          updateDevice({
            deviceId: e.target.value,
            deviceType: DeviceType.videoInput,
          })
        }
      />
      <Select
        title="Microphone"
        value={selectedDeviceIDs.audioInput}
        list={audioInput}
        onChange={e =>
          updateDevice({
            deviceId: e.target.value,
            deviceType: DeviceType.audioInput,
          })
        }
      />
      <Select
        title="Speaker"
        value={selectedDeviceIDs.audioOutput}
        list={audioOutput}
        onChange={e =>
          updateDevice({
            deviceId: e.target.value,
            deviceType: DeviceType.audioOutput,
          })
        }
      />
    </div>
  );
};

const Select = ({ list, value, onChange, title }) => {
  return (
    <div>
      <span>{title}:</span>
      {list?.length ? (
        <select onChange={onChange} value={value}>
          {list.map(device => (
            <option value={device.deviceId} key={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
};

export default DeviceSettings;

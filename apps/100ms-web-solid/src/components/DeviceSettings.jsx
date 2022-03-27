// @ts-check
import { useDevices, DeviceType } from '@100mslive/solid-sdk';
import { For } from 'solid-js';

const DeviceSettings = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  return (
    <div>
      <h1>Device Settings</h1>
      <Select
        title="Camera"
        value={selectedDeviceIDs().videoInput}
        list={allDevices().videoInput}
        onChange={e =>
          updateDevice({
            deviceId: e.target.value,
            deviceType: DeviceType.videoInput,
          })
        }
      />
      <Select
        title="Microphone"
        value={selectedDeviceIDs().audioInput}
        list={allDevices().audioInput}
        onChange={e =>
          updateDevice({
            deviceId: e.target.value,
            deviceType: DeviceType.audioInput,
          })
        }
      />
      <Select
        title="Speaker"
        value={selectedDeviceIDs().audioOutput}
        list={allDevices().audioOutput}
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

const Select = props => {
  return (
    <div>
      <span>{props.title}:</span>
      {props.list?.length ? (
        <select onChange={props.onChange} value={props.value}>
          <For each={props.list}>
            {device => (
              <option value={device.deviceId} key={device.deviceId}>
                {device.label}
              </option>
            )}
          </For>
        </select>
      ) : null}
    </div>
  );
};

export default DeviceSettings;

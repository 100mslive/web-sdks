import { HMSRoleName, HMSTrackSource, HMSTrackType, selectPermissions, useHMSStore } from '@100mslive/react-sdk';
import { Button } from '../../../Button';
import { Label } from '../../../Label';
import { Flex } from '../../../Layout';
import { RadioGroup } from '../../../RadioGroup';
import { Text } from '../../../Text';
// @ts-ignore: No implicit any
import { DialogRow, DialogSelect } from '../../primitives/DialogContent';
import { trackSourceOptions, trackTypeOptions } from './constants';

export const MuteAllContent = (props: {
  muteAll: () => Promise<void>;
  roles?: HMSRoleName[];
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  trackType?: HMSTrackType;
  setTrackType: (value: HMSTrackType) => void;
  selectedRole?: HMSRoleName;
  setRole: (value: HMSRoleName) => void;
  selectedSource?: HMSTrackSource;
  setSource: (value: HMSTrackSource) => void;
  isMobile: boolean;
}) => {
  const roles = props.roles || [];
  const permissions = useHMSStore(selectPermissions);
  return (
    <>
      <DialogSelect
        title="Role"
        options={[{ label: 'All Roles', value: '' }, ...roles.map(role => ({ label: role, value: role }))]}
        selected={props.selectedRole}
        keyField="value"
        labelField="label"
        onChange={props.setRole}
      />
      <DialogSelect
        title="Track type"
        options={trackTypeOptions}
        selected={props.trackType}
        onChange={props.setTrackType}
        keyField="value"
        labelField="label"
      />
      <DialogSelect
        title="Track source"
        options={trackSourceOptions}
        selected={props.selectedSource}
        onChange={props.setSource}
        keyField="value"
        labelField="label"
      />
      <DialogRow>
        <Text variant="md">Track status</Text>
        <RadioGroup.Root value={String(props.enabled)} onValueChange={value => props.setEnabled(value === 'true')}>
          {permissions?.mute && (
            <Flex align="center" css={{ mr: '$8' }}>
              <RadioGroup.Item value="false" id="trackDisableRadio" css={{ mr: '$4' }}>
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Label htmlFor="trackDisableRadio">Mute</Label>
            </Flex>
          )}
          {permissions?.unmute && (
            <Flex align="center" css={{ cursor: 'pointer' }}>
              <RadioGroup.Item value="true" id="trackEnableRadio" css={{ mr: '$4' }}>
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Label htmlFor="trackEnableRadio">Request Unmute</Label>
            </Flex>
          )}
        </RadioGroup.Root>
      </DialogRow>
      <DialogRow justify="end">
        <Button variant="primary" onClick={props.muteAll} css={{ w: props?.isMobile ? '100%' : '' }}>
          Apply
        </Button>
      </DialogRow>
    </>
  );
};

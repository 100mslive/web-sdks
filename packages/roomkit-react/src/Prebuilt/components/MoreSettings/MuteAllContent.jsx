import { Button } from '../../../Button';
import { DialogRow } from '../../primitives/DialogContent';
import { DialogSelect } from '../../primitives/DialogContent';
import { Text } from '../../../Text';
import { RadioGroup } from '../../../RadioGroup';
import { Flex } from '../../../Layout';
import { Label } from '../../../Label';

export const MuteAllContent = props => {
  const roles = props.roles || [];
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
        options={props.trackTypeOptions}
        selected={props.trackType}
        onChange={props.setTrackType}
        keyField="value"
        labelField="label"
      />
      <DialogSelect
        title="Track source"
        options={props.trackSourceOptions}
        selected={props.selectedSource}
        onChange={props.setSource}
        keyField="value"
        labelField="label"
      />
      <DialogRow>
        <Text variant="md">Track status</Text>
        <RadioGroup.Root value={props.enabled} onValueChange={props.setEnabled}>
          <Flex align="center" css={{ mr: '$8' }}>
            <RadioGroup.Item value={false} id="trackDisableRadio" css={{ mr: '$4' }}>
              <RadioGroup.Indicator />
            </RadioGroup.Item>
            <Label htmlFor="trackDisableRadio">Mute</Label>
          </Flex>
          <Flex align="center" css={{ cursor: 'pointer' }}>
            <RadioGroup.Item value={true} id="trackEnableRadio" css={{ mr: '$4' }}>
              <RadioGroup.Indicator />
            </RadioGroup.Item>
            <Label htmlFor="trackEnableRadio">Request Unmute</Label>
          </Flex>
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

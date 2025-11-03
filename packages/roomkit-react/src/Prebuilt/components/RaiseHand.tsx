import { HandIcon, HandRaiseSlashedIcon } from '@100mslive/react-icons';
import { CSS } from '../../Theme';
import { Tooltip } from '../../Tooltip';
// @ts-ignore: No implicit Any
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useMyMetadata } from './hooks/useMetadata';

export const RaiseHand = ({ css }: { css?: CSS }) => {
  const { isHandRaised, toggleHandRaise } = useMyMetadata();
  const { elements } = useRoomLayoutConferencingScreen();

  if (!elements.hand_raise) {
    return null;
  }

  return (
    <Tooltip title={isHandRaised ? 'Lower hand' : 'Raise hand'}>
      <IconButton
        data-testid="hand_raise_btn"
        css={css}
        active={!isHandRaised}
        onClick={async () => await toggleHandRaise()}
      >
        {isHandRaised ? <HandRaiseSlashedIcon /> : <HandIcon />}
      </IconButton>
    </Tooltip>
  );
};

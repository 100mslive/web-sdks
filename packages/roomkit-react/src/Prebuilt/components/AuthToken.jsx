import React, { useEffect, useState } from 'react';
import { useSessionStorage } from 'react-use';
import { v4 as uuid } from 'uuid';
import { useHMSActions } from '@100mslive/react-sdk';
import { Dialog } from '../../Modal';
import { Text } from '../../Text';
import { useHMSPrebuiltContext } from '../AppContext';
import errorImage from '../images/transaction_error.svg';
import { useSetAppDataByKey } from './AppData/useUISettings';
import { UserPreferencesKeys } from './hooks/useUserPreferences';
import { APP_DATA } from '../common/constants';

/**
 * query params exposed -
 * skip_preview=true => used by recording and streaming service, skips preview and directly joins
 *                      header and footer don't show up in this case
 * skip_preview_headful=true => used by automation testing to skip preview without impacting the UI
 * name=abc => gives the initial name for the peer joining
 * auth_token=123 => uses the passed in token to join instead of fetching from token endpoint
 * ui_mode=activespeaker => lands in active speaker mode after joining the room
 */
const AuthToken = React.memo(({ authTokenByRoomCodeEndpoint, defaultAuthToken }) => {
  const hmsActions = useHMSActions();
  const { roomCode, userId } = useHMSPrebuiltContext();
  const [error, setError] = useState({ title: '', body: '' });
  let authToken = defaultAuthToken;
  const [, setAuthTokenInAppData] = useSetAppDataByKey(APP_DATA.authToken);
  const [savedUserId, setSavedUserId] = useSessionStorage(UserPreferencesKeys.USER_ID);

  useEffect(() => {
    if (authToken) {
      setAuthTokenInAppData(authToken);
      return;
    }

    if (!roomCode) {
      return;
    }

    if (!savedUserId && !userId) {
      setSavedUserId(uuid());
      return;
    }

    hmsActions
      .getAuthTokenByRoomCode({ roomCode, userId: userId || savedUserId }, { endpoint: authTokenByRoomCodeEndpoint })
      .then(token => setAuthTokenInAppData(token))
      .catch(error => setError(convertError(error)));
  }, [
    hmsActions,
    authToken,
    authTokenByRoomCodeEndpoint,
    setAuthTokenInAppData,
    roomCode,
    userId,
    savedUserId,
    setSavedUserId,
  ]);

  if (error.title) {
    return (
      <Dialog.Root open={true}>
        <Dialog.Content
          css={{
            maxWidth: '$100',
            boxSizing: 'border-box',
            p: '$10 $12',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <img src={errorImage} height={80} width={80} />
          <Text variant="h4" css={{ textAlign: 'center', mb: '$4', mt: '$10' }}>
            {error.title}
          </Text>
          <Text css={{ c: '$on_surface_medium', textAlign: 'center' }}>{error.body}</Text>
        </Dialog.Content>
      </Dialog.Root>
    );
  }
  return null;
});

const convertError = error => {
  console.error('[error]', { error });
  console.warn(
    'If you think this is a mistake on our side, please reach out to us over Discord:',
    'https://discord.com/invite/kGdmszyzq2',
  );
  if (error.action === 'GET_TOKEN' && error.code === 403) {
    return {
      title: 'Psst! This room is currently inactive.',
      body: 'Please feel free to join another open room for more conversations. Thanks for stopping by!',
    };
  } else if (error.action === 'GET_TOKEN' && error.code === 404) {
    return {
      title: 'Room code does not exist',
      body: 'We could not find a room code corresponding to this link.',
    };
  } else if (error.action === 'GET_TOKEN' && error.code === 2003) {
    return {
      title: 'Endpoint is not reachable',
      body: `Endpoint is not reachable. ${error.description}.`,
    };
  } else if (error.response && error.response.status === 404) {
    return {
      title: 'Room does not exist',
      body: 'We could not find a room corresponding to this link.',
    };
  } else if (error.response && error.response.status === 403) {
    return {
      title: 'Accessing room using this link format is disabled',
      body: 'You can re-enable this from the developer section in Dashboard.',
    };
  } else {
    console.error('Token API Error', error);
    return {
      title: 'Error fetching token',
      body: 'An error occurred while fetching the app token. Please look into logs for more details.',
    };
  }
};

export default AuthToken;

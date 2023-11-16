import React, { useEffect, useState } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { styled } from '../../Theme';
import { useHMSPrebuiltContext } from '../AppContext';
import { ErrorDialog } from '../primitives/DialogContent';
import { useSetAppDataByKey, useTokenEndpoint } from './AppData/useUISettings';
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
  const tokenEndpoint = useTokenEndpoint();
  const { roomCode, userId } = useHMSPrebuiltContext();
  const [error, setError] = useState({ title: '', body: '' });
  let authToken = defaultAuthToken;
  const [, setAuthTokenInAppData] = useSetAppDataByKey(APP_DATA.authToken);

  useEffect(() => {
    if (authToken) {
      setAuthTokenInAppData(authToken);
      return;
    }
    if (!tokenEndpoint && !roomCode) {
      return;
    }

    hmsActions
      .getAuthTokenByRoomCode({ roomCode, userId }, { endpoint: authTokenByRoomCodeEndpoint })
      .then(token => setAuthTokenInAppData(token))
      .catch(error => setError(convertError(error)));
  }, [hmsActions, tokenEndpoint, authToken, authTokenByRoomCodeEndpoint, setAuthTokenInAppData, roomCode, userId]);

  if (error.title) {
    return <ErrorDialog title={error.title}>{error.body}</ErrorDialog>;
  }
  return null;
});

const convertError = error => {
  console.error('[error]', { error });
  if (error.action === 'GET_TOKEN' && error.code === 403) {
    return {
      title: 'Room code is disabled',
      body: ErrorWithSupportLink('Room code corresponding to this link is no more active.'),
    };
  } else if (error.action === 'GET_TOKEN' && error.code === 404) {
    return {
      title: 'Room code does not exist',
      body: ErrorWithSupportLink('We could not find a room code corresponding to this link.'),
    };
  } else if (error.action === 'GET_TOKEN' && error.code === 2003) {
    return {
      title: 'Endpoint is not reachable',
      body: ErrorWithSupportLink(`Endpoint is not reachable. ${error.description}.`),
    };
  } else if (error.response && error.response.status === 404) {
    return {
      title: 'Room does not exist',
      body: ErrorWithSupportLink('We could not find a room corresponding to this link.'),
    };
  } else if (error.response && error.response.status === 403) {
    return {
      title: 'Accessing room using this link format is disabled',
      body: ErrorWithSupportLink('You can re-enable this from the developer section in Dashboard.'),
    };
  } else {
    console.error('Token API Error', error);
    return {
      title: 'Error fetching token',
      body: ErrorWithSupportLink(
        'An error occurred while fetching the app token. Please look into logs for more details.',
      ),
    };
  }
};

const Link = styled('a', {
  color: '#2f80e1',
});

export const ErrorWithSupportLink = errorMessage => (
  <div>
    {errorMessage} If you think this is a mistake on our side, please create{' '}
    <Link target="_blank" href="https://github.com/100mslive/100ms-web/issues" rel="noreferrer">
      an issue
    </Link>{' '}
    or reach out over{' '}
    <Link target="_blank" href="https://discord.com/invite/kGdmszyzq2" rel="noreferrer">
      Discord
    </Link>
    .
  </div>
);

export default AuthToken;

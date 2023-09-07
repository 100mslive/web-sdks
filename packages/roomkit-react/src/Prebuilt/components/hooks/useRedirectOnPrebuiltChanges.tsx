import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrevious } from 'react-use';
import { selectIsConnectedToRoom, useHMSStore } from '@100mslive/react-sdk';
import { useHMSPrebuiltContext } from '../../AppContext';

export const useRedirectOnPrebuiltChanges = () => {
  const { roomCode, role, roomId } = useHMSPrebuiltContext();
  const navigate = useNavigate();
  const isConnectedToRoom = useHMSStore(selectIsConnectedToRoom);
  const prevRoomCode = usePrevious(roomCode);
  const prevRoomId = usePrevious(roomId);
  const prevRole = usePrevious(role);

  useEffect(() => {
    if (isConnectedToRoom && prevRoomCode && prevRoomCode !== roomCode) {
      navigate(`/${roomCode}`);
    }
  }, [isConnectedToRoom, roomCode, prevRoomCode, navigate]);

  useEffect(() => {
    if (isConnectedToRoom && prevRoomId && prevRole && (prevRoomId !== roomId || prevRole !== role)) {
      navigate(`/${roomId}/${role}`);
    }
  }, [isConnectedToRoom, roomId, prevRoomId, role, prevRole, navigate]);
};

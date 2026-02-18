/**
 * Whiteboard component with backward-compatible API
 * Wraps whiteboard-core with session store integration
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  type ElementId,
  type WhiteboardElement,
  type WhiteboardHandle,
  decodeJWT,
  useHMSWhiteboard,
  useHMSWhiteboardSync,
  useWhiteboardState,
  Whiteboard as WhiteboardCore,
} from '@100mslive/whiteboard-core';

export interface WhiteboardProps {
  /** JWT authentication token for session store */
  token: string;
  /** Session store endpoint URL */
  endpoint?: string;
  /** Whether to zoom canvas to fit content (for viewers) */
  zoomToContent?: boolean;
  /** Whether to use transparent canvas background */
  transparentCanvas?: boolean;
  /** Callback when whiteboard is mounted */
  onMount?: (args: { store?: unknown; editor?: unknown }) => void;
}

/**
 * Whiteboard component with 100ms session store integration
 *
 * This component provides a backward-compatible API for the whiteboard,
 * wrapping the whiteboard-core with automatic session store synchronization.
 */
export function Whiteboard({
  token,
  endpoint = 'https://store-prod-in3-grpc.100ms.live',
  zoomToContent = false,
  transparentCanvas = false,
  onMount,
}: WhiteboardProps) {
  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const whiteboardState = useWhiteboardState();

  // Parse user info from JWT token
  const user = useMemo(() => {
    try {
      const payload = decodeJWT(token);
      return {
        id: (payload.user_id as string) || 'anonymous',
        name: (payload.name as string) || 'Anonymous',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      };
    } catch {
      return {
        id: 'anonymous',
        name: 'Anonymous',
        color: '#999999',
      };
    }
  }, [token]);

  // Check if user has write permissions
  const isReadonly = useMemo(() => {
    try {
      const payload = decodeJWT(token);
      const permissions = payload.permissions as string[] | undefined;
      return !permissions?.includes('write');
    } catch {
      return true;
    }
  }, [token]);

  // Connect to HMS session store
  const hmsWhiteboard = useHMSWhiteboard({
    endpoint,
    token,
    user,
    autoConnect: true,
  });

  // Sync whiteboard state with HMS session store
  useHMSWhiteboardSync(
    {
      elements: Array.from(whiteboardState.state.elements.values()),
      addElement: whiteboardState.addElement,
      updateElement: (id: ElementId, updates: Partial<WhiteboardElement>) => {
        whiteboardState.updateElement(id, updates);
      },
      deleteElement: (id: ElementId) => {
        whiteboardState.removeElements([id]);
      },
    },
    hmsWhiteboard,
    { direction: 'bidirectional' },
  );

  // Call onMount callback when ready
  useEffect(() => {
    if (hmsWhiteboard.isConnected && whiteboardRef.current) {
      onMount?.({
        store: hmsWhiteboard,
        editor: whiteboardRef.current,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hmsWhiteboard.isConnected, onMount]);

  // Auto-set tool based on permissions
  useEffect(() => {
    if (isReadonly) {
      whiteboardState.setActiveTool('pan');
    }
  }, [isReadonly, whiteboardState]);

  return (
    <WhiteboardCore
      ref={whiteboardRef}
      showToolbar={!isReadonly}
      className={transparentCanvas ? 'transparent-canvas' : undefined}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default Whiteboard;

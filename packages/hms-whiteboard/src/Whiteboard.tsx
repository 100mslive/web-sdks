/**
 * Whiteboard component with backward-compatible API
 * Wraps whiteboard-core with session store integration via protobuf-ts gRPC-web
 *
 * Follows the tldraw onChange pattern:
 * - Core fires state change events via stateManager.subscribe()
 * - This component handles all sync externally using SessionStore (protobuf-ts)
 * - No gRPC code needed in core for this integration path
 */
import React, { useEffect, useMemo, useRef } from 'react';
import {
  type ElementId,
  type WhiteboardElement,
  type WhiteboardHandle,
  type WhiteboardStateData,
  decodeJWT,
  useWhiteboardState,
  Whiteboard as WhiteboardCore,
} from '@100mslive/whiteboard-core';
import { SessionStore } from './hooks/StoreClient';

/** Element record stored in session store */
interface ElementRecord {
  element: WhiteboardElement;
  version: number;
  updatedBy: string;
  updatedAt: number;
}

const KEY_PREFIX = 'wb:el:';

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
 * Custom hook that syncs local whiteboard state with remote session store.
 *
 * Local → Remote: subscribes to stateManager changes, diffs elements, pushes to SessionStore
 * Remote → Local: listens to SessionStore stream, applies remote changes to stateManager
 */
function useSessionStoreSync(
  stateManager: ReturnType<typeof useWhiteboardState>['stateManager'],
  sessionStore: SessionStore<ElementRecord> | null,
  userId: string,
) {
  const lastSyncRef = useRef<Map<ElementId, WhiteboardElement>>(new Map());
  const isConnectedRef = useRef(false);
  // Track whether we're applying remote changes to avoid echo loops
  const applyingRemoteRef = useRef(false);

  // Remote → Local: listen for session store changes
  useEffect(() => {
    if (!sessionStore) return;

    const closePromise = sessionStore.open({
      handleOpen: (values: ElementRecord[]) => {
        isConnectedRef.current = true;
        applyingRemoteRef.current = true;

        for (const record of values) {
          if (!record.element) continue;
          const el = record.element;
          lastSyncRef.current.set(el.id, el);

          const existing = stateManager.getState().elements.get(el.id);
          if (existing) {
            stateManager.updateElement(el.id, el);
          } else {
            stateManager.addElement(el);
          }
        }

        applyingRemoteRef.current = false;
      },
      handleChange: (key: string, value?: ElementRecord) => {
        if (!key.startsWith(KEY_PREFIX)) return;

        // Skip self-updates
        if (value && value.updatedBy === userId) return;

        applyingRemoteRef.current = true;

        if (value && value.element) {
          const el = value.element;
          lastSyncRef.current.set(el.id, el);

          const existing = stateManager.getState().elements.get(el.id);
          if (existing) {
            stateManager.updateElement(el.id, el);
          } else {
            stateManager.addElement(el);
          }
        } else {
          // Deletion
          const elementId = key.slice(KEY_PREFIX.length);
          lastSyncRef.current.delete(elementId);
          stateManager.removeElements([elementId]);
        }

        applyingRemoteRef.current = false;
      },
      handleError: (error: Error) => {
        console.error('Whiteboard sync error:', error);
      },
    });

    let closeFn: (() => void) | undefined;
    closePromise.then(fn => {
      closeFn = fn;
    });

    return () => {
      isConnectedRef.current = false;
      closeFn?.();
    };
  }, [sessionStore, stateManager, userId]);

  // Local → Remote: subscribe to state changes and push diffs
  useEffect(() => {
    if (!sessionStore) return;

    const unsubscribe = stateManager.subscribe((state: WhiteboardStateData) => {
      // Don't sync back changes we just applied from remote
      if (applyingRemoteRef.current) return;
      if (!isConnectedRef.current) return;

      const currentElements = state.elements;
      const prevElements = lastSyncRef.current;

      // Find adds and updates
      currentElements.forEach((element, id) => {
        const prev = prevElements.get(id);
        if (!prev || prev !== element) {
          const record: ElementRecord = {
            element,
            version: prev ? 2 : 1,
            updatedBy: userId,
            updatedAt: Date.now(),
          };
          lastSyncRef.current.set(id, element);
          sessionStore.set(`${KEY_PREFIX}${id}`, record);
        }
      });

      // Find deletes
      prevElements.forEach((_element, id) => {
        if (!currentElements.has(id)) {
          lastSyncRef.current.delete(id);
          sessionStore.delete(`${KEY_PREFIX}${id}`);
        }
      });
    });

    return unsubscribe;
  }, [sessionStore, stateManager, userId]);
}

/**
 * Whiteboard component with 100ms session store integration
 *
 * Uses the tldraw onChange pattern: core handles local state,
 * this component handles all sync externally via protobuf-ts gRPC-web.
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
  const userId = useMemo(() => {
    try {
      const payload = decodeJWT(token);
      return (payload.user_id as string) || 'anonymous';
    } catch {
      return 'anonymous';
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

  // Create session store (protobuf-ts gRPC-web client)
  const sessionStore = useMemo(() => {
    if (!token || !endpoint) return null;
    return new SessionStore<ElementRecord>(endpoint, token);
  }, [endpoint, token]);

  // Sync local ↔ remote via session store
  useSessionStoreSync(whiteboardState.stateManager, sessionStore, userId);

  // Call onMount callback when ready
  const onMountCalled = useRef(false);
  useEffect(() => {
    if (!onMountCalled.current && whiteboardRef.current && sessionStore) {
      onMountCalled.current = true;
      onMount?.({
        store: sessionStore,
        editor: whiteboardRef.current,
      });
    }
  }, [onMount, sessionStore]);

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

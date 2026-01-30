import { useCallback, useEffect, useState } from 'react';
import {
  createTLStore,
  debounce,
  defaultShapeUtils,
  Editor,
  HistoryEntry,
  throttle,
  TLAnyShapeUtilConstructor,
  TLInstance,
  TLINSTANCE_ID,
  TLPage,
  TLRecord,
  TLStoreWithStatus,
  transact,
} from '@tldraw/tldraw';
import { DEFAULT_STORE } from './default_store';
import { useSessionStore } from './useSessionStore';
import { useSetEditorPermissions } from './useSetEditorPermissions';
import { CURRENT_PAGE_KEY, PAGES_DEBOUNCE_TIME, SHAPES_THROTTLE_TIME } from '../utils';

// mandatory record types required for initialisation of the whiteboard and for a full remote sync
const FULL_SYNC_REQUIRED_RECORD_TYPES: TLRecord['typeName'][] = [
  'camera',
  'document',
  'instance',
  'instance_page_state',
  'page',
];

export function useCollaboration({
  endpoint,
  token,
  editor,
  shapeUtils = [],
  zoomToContent = false,
}: {
  endpoint?: string;
  token?: string;
  editor?: Editor;
  shapeUtils?: TLAnyShapeUtilConstructor[];
  zoomToContent?: boolean;
}) {
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    store.loadSnapshot(DEFAULT_STORE);
    return store;
  });

  const [currentPage, setCurrentPage] = useState<TLPage | undefined>(editor?.getCurrentPage());

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });

  const handleError = useCallback(
    (error: Error, isTerminal?: boolean) => {
      setStoreWithStatus(
        isTerminal
          ? {
              error,
              status: 'error',
            }
          : {
              store,
              status: 'synced-remote',
              connectionStatus: 'offline',
            },
      );
    },
    [store],
  );

  const sessionStore = useSessionStore({ token, endpoint, handleError });
  const permissions = useSetEditorPermissions({ token, editor, zoomToContent, handleError });

  const handleOpen = useCallback(
    (initialRecords: TLRecord[]) => {
      if (!sessionStore) {
        return;
      }

      // Initialize the tldraw store with the session store server records—or, if the session store
      // is empty, initialize the session store server with the default tldraw store records.
      const shouldUseServerRecords = FULL_SYNC_REQUIRED_RECORD_TYPES.every(
        type => initialRecords.filter(record => record.typeName === type).length > 0,
      );
      if (shouldUseServerRecords) {
        // Save local shape records before syncing with server (for offline change preservation)
        const localShapeRecords = store.allRecords().filter(record => record.typeName === 'shape');
        const serverRecordIds = new Set(initialRecords.map(r => r.id));

        // Replace the tldraw store records with session store
        store.mergeRemoteChanges(() => {
          store.clear();
          store.put(initialRecords);
        });

        // Sync local-only shapes back to server (offline changes preservation)
        for (const record of localShapeRecords) {
          if (!serverRecordIds.has(record.id)) {
            store.put([record]); // Add back to local store
            sessionStore.set(record.id, record); // Sync to server
          }
        }
      } else {
        // Create the initial store records
        // Sync the local tldraw store records to session store
        for (const record of store.allRecords()) {
          sessionStore.set(record.id, record);
        }
      }
      setStoreWithStatus({
        store,
        status: 'synced-remote',
        connectionStatus: 'online',
      });
    },
    [store, sessionStore],
  );

  const handleChange = useCallback(
    (key: string, value?: TLRecord) => {
      // put / remove the records in the store
      store.mergeRemoteChanges(() => {
        if (!value) {
          return store.remove([key as TLRecord['id']]);
        }
        if (key === CURRENT_PAGE_KEY) {
          setCurrentPage(value as TLPage);
        } else {
          transact(() => {
            store.put([value]);
            if (key === TLINSTANCE_ID) {
              store.put([
                { ...value, canMoveCamera: !!zoomToContent, isReadonly: !permissions.includes('write') } as TLInstance,
              ]);
            }
          });
        }
      });
    },
    [store, permissions, zoomToContent],
  );

  useEffect(() => {
    if (!sessionStore) return;

    setStoreWithStatus({ status: 'loading' });

    const unsubs: (() => void)[] = [];

    // Open session and sync the session store changes to the store
    sessionStore
      .open({
        handleOpen,
        handleChange,
        handleError,
      })
      .then(unsub => unsubs.push(unsub));

    // Sync store changes to the yjs doc
    unsubs.push(
      store.listen(
        throttle(function syncStoreChangesToYjsDoc({ changes }: HistoryEntry<TLRecord>) {
          Object.values(changes.added).forEach(record => {
            sessionStore.set(record.id, record);
          });

          Object.values(changes.updated).forEach(([, record]) => {
            sessionStore.set(record.id, record);
          });

          Object.values(changes.removed).forEach(record => {
            sessionStore.delete(record.id);
          });
        }, SHAPES_THROTTLE_TIME),
        { source: 'user', scope: 'document' }, // only sync user's document changes
      ),
    );

    // let hasConnectedBefore = false;

    // function handleStatusChange({
    //   status,
    // }: {
    //   status: "disconnected" | "connected";
    // }) {
    //   // If we're disconnected, set the store status to 'synced-remote' and the connection status to 'offline'
    //   if (status === "disconnected") {
    //     setStoreWithStatus({
    //       store,
    //       status: "synced-remote",
    //       connectionStatus: "offline",
    //     });
    //     return;
    //   }

    //   room.off("synced", handleSync);

    //   if (status === "connected") {
    //     if (hasConnectedBefore) return;
    //     hasConnectedBefore = true;
    //     room.on("synced", handleSync);
    //     unsubs.push(() => room.off("synced", handleSync));
    //   }
    // }

    // room.on("status", handleStatusChange);
    // unsubs.push(() => room.off("status", handleStatusChange));

    return () => {
      unsubs.forEach(fn => fn());
      unsubs.length = 0;
    };
  }, [store, sessionStore, handleChange, handleOpen, handleError]);

  useEffect(() => {
    if (!editor || !sessionStore) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      store.listen(
        debounce(({ changes }) => {
          Object.keys(changes.updated).forEach(key => {
            // Only update the current page id from the instance changes, ignore pointer changes
            if (!key.includes('instance')) {
              return;
            }
            const newPage = editor?.getCurrentPage();

            if (newPage?.id !== currentPage?.id) {
              sessionStore.get(TLINSTANCE_ID).then(instance => {
                if (instance) {
                  sessionStore?.set(instance.id, { ...instance, currentPageId: newPage?.id } as TLInstance);
                }
              });
              setCurrentPage(newPage);
            }
          });
        }, PAGES_DEBOUNCE_TIME),
        { source: 'user', scope: 'session' },
      ),
    );

    return () => {
      unsubs.forEach(fn => fn());
      unsubs.length = 0;
    };
  }, [currentPage, editor, sessionStore, store]);

  // zoom to fit on remote changes for hls viewer
  useEffect(() => {
    if (!editor || !editor.getInstanceState()?.isReadonly || !zoomToContent) return;

    store.listen(
      () => {
        editor.zoomToFit();
      },
      { source: 'remote', scope: 'document' },
    );
  }, [editor, store, zoomToContent]);

  return storeWithStatus;
}

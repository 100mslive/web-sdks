import { useCallback, useEffect, useState } from 'react';
import {
  createTLStore,
  debounce,
  defaultShapeUtils,
  Editor,
  HistoryEntry,
  throttle,
  TLAnyShapeUtilConstructor,
  TLPage,
  TLRecord,
  TLStoreWithStatus,
} from '@tldraw/tldraw';
import { DEFAULT_STORE } from './default_store';
import { useSessionStore } from './useSessionStore';
import { useSetEditorPermissions } from './useSetEditorPermissions';
import { CURRENT_PAGE_KEY, PAGES_DEBOUNCE_TIME, SHAPES_THROTTLE_TIME } from '../utils';

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

  const handleError = useCallback((error: Error) => {
    setStoreWithStatus({
      status: 'error',
      error,
    });
  }, []);

  const sessionStore = useSessionStore({ token, endpoint, handleError });

  useSetEditorPermissions({ token, editor, zoomToContent, handleError });

  useEffect(() => {
    if (!currentPage?.id || !editor || editor.getCurrentPageId() === currentPage.id) {
      return;
    }

    if (!editor.getPages().find(page => page.id === currentPage.id)) {
      editor.createPage(currentPage);
    }

    editor?.setCurrentPage(currentPage);
  }, [currentPage, editor]);

  useEffect(() => {
    if (!sessionStore) return;

    setStoreWithStatus({ status: 'loading' });

    const unsubs: (() => void)[] = [];

    // 1.
    // Connect store to yjs store and vis versa, for both the document and awareness

    /* -------------------- Document -------------------- */

    const handleChange = (key: string, value?: TLRecord) => {
      // put / remove the records in the store
      store.mergeRemoteChanges(() => {
        if (!value) {
          return store.remove([key as TLRecord['id']]);
        }
        if (key === CURRENT_PAGE_KEY) {
          setCurrentPage(value as TLPage);
        } else {
          store.put([value]);
        }
      });
    };

    // Open session and sync the session store changes to the store
    sessionStore.open({
      handleChange,
      handleError,
    });

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

    // 2.
    // Initialize the store with the yjs doc records—or, if the yjs doc
    // is empty, initialize the yjs doc with the default store records.
    // if (yStore.yarray.length) {
    //   // Replace the store records with the yjs doc records
    //   transact(() => {
    //     // The records here should be compatible with what's in the store
    //     store.clear();
    //     const records = yStore.yarray.toJSON().map(({ val }) => val);
    //     store.put(records);
    //   });
    // } else {
    //   // Create the initial store records
    //   // Sync the store records to the yjs doc
    //   for (const record of store.allRecords()) {
    //     sessionStore.set(record.id, record);
    //   }
    // }

    setStoreWithStatus({
      store,
      status: 'synced-remote',
      connectionStatus: 'online',
    });

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
  }, [store, sessionStore, handleError]);

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
              sessionStore?.set(CURRENT_PAGE_KEY, newPage);
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
    if (!editor || !editor.getInstanceState().isReadonly || !zoomToContent) return;

    store.listen(
      () => {
        editor.zoomToFit();
      },
      { source: 'remote', scope: 'document' },
    );
  }, [editor, store, zoomToContent]);

  return storeWithStatus;
}

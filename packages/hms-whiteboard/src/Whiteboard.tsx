import React, { useState } from 'react';
import { Editor, Tldraw } from '@tldraw/tldraw';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import { getQueryParams } from './utils';
import '@tldraw/tldraw/tldraw.css';
import './index.css';

const { endpoint: queryEndpoint, token: queryToken, zoom_to_content } = getQueryParams();

export interface WhiteboardProps {
  endpoint?: string;
  token?: string;
  zoomToContent?: boolean;
  onMount?: (args: { store?: unknown; editor?: unknown }) => void;
}
export function Whiteboard({
  onMount,
  endpoint = queryEndpoint,
  token = queryToken,
  zoomToContent = zoom_to_content === 'true',
}: WhiteboardProps) {
  const [editor, setEditor] = useState<Editor>();
  const store = useCollaboration({
    endpoint,
    token,
    editor,
    zoomToContent,
  });

  const handleMount = (editor: Editor) => {
    setEditor(editor);
    // @ts-expect-error - for debugging
    window.editor = editor;
    onMount?.({ store: store.store, editor });
  };

  return (
    <Tldraw
      autoFocus
      store={store}
      onMount={handleMount}
      components={{ ErrorFallback }}
      hideUi={editor?.getInstanceState()?.isReadonly}
    />
  );
}

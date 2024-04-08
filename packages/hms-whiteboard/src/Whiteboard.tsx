import React, { useState } from 'react';
import { Editor, Tldraw } from '@tldraw/tldraw';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import { getQueryParams } from './utils';
import '@tldraw/tldraw/tldraw.css';
import './index.css';

const { endpoint: queryEndpoint, token: queryToken, zoom_to_content } = getQueryParams();

export function Whiteboard({
  endpoint = queryEndpoint,
  token = queryToken,
  zoomToContent = zoom_to_content === 'true',
}: {
  endpoint?: string;
  token?: string;
  zoomToContent?: boolean;
}) {
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
  };

  return (
    <Tldraw
      autoFocus
      store={store}
      onMount={handleMount}
      components={{ ErrorFallback }}
      hideUi={editor?.instanceState?.isReadonly}
    />
  );
}

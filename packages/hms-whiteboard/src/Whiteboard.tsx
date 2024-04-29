import React, { useState } from 'react';
import { Editor, Tldraw } from '@tldraw/tldraw';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import './index.css';

export interface WhiteboardProps {
  endpoint?: string;
  token?: string;
  zoomToContent?: boolean;
  transparentCanvas?: boolean;
  onMount?: (args: { store?: unknown; editor?: unknown }) => void;
}
export function Whiteboard({ onMount, endpoint, token, zoomToContent, transparentCanvas }: WhiteboardProps) {
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
      className={transparentCanvas ? 'transparent-canvas' : ''}
      autoFocus
      store={store}
      onMount={handleMount}
      components={{ ErrorFallback }}
      hideUi={editor?.getInstanceState()?.isReadonly}
    />
  );
}

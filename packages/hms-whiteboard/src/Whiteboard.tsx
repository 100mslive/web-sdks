import React, { useState } from 'react';
import { Editor, Tldraw, TLStore } from '@tldraw/tldraw';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import './index.css';

export interface WhiteboardProps {
  endpoint?: string;
  token: string;
  zoomToContent?: boolean;
  transparentCanvas?: boolean;
  onMount?: (args: { store?: TLStore; editor?: Editor }) => void;
}
export function Whiteboard({ endpoint, token, zoomToContent, transparentCanvas, onMount }: WhiteboardProps) {
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
      initialState={editor?.getInstanceState()?.isReadonly ? 'hand' : 'select'}
    />
  );
}

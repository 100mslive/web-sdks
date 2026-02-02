import React, { useState } from 'react';
import { Editor, Tldraw } from '@tldraw/tldraw';
import { ConnectionStatusToast } from './ConnectionStatusToast';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import './index.css';

export interface WhiteboardProps {
  endpoint?: string;
  token: string;
  zoomToContent?: boolean;
  transparentCanvas?: boolean;
  onMount?: (args: { store?: unknown; editor?: unknown }) => void;
}
export function Whiteboard(props: WhiteboardProps) {
  const [key, setKey] = useState(Date.now() + props.token);

  return <CollaborativeEditor key={key} refresh={() => setKey(Date.now() + props.token)} {...props} />;
}

function CollaborativeEditor({
  endpoint,
  token,
  zoomToContent,
  transparentCanvas,
  onMount,
  refresh,
}: WhiteboardProps & { refresh: () => void }) {
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
      components={{
        ErrorFallback: ({ error, editor }) => <ErrorFallback editor={editor} error={error} refresh={refresh} />,
      }}
      hideUi={editor?.getInstanceState()?.isReadonly}
      initialState={editor?.getInstanceState()?.isReadonly ? 'hand' : 'select'}
    >
      <ConnectionStatusToast store={store} />
    </Tldraw>
  );
}

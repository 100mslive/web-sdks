import { ComponentType, useState } from 'react';
import { Editor, Tldraw, TldrawProps } from '@tldraw/tldraw';
import { ErrorFallback } from './ErrorFallback';
import { useCollaboration } from './hooks/useCollaboration';
import './index.css';

// Cast Tldraw to ComponentType for React 19 compatibility
const TldrawComponent = Tldraw as unknown as ComponentType<TldrawProps>;

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

  if (store.status === 'synced-remote' && store.connectionStatus === 'offline') {
    return <ErrorFallback error={Error('Network connection lost')} editor={editor} refresh={refresh} />;
  }

  return (
    <TldrawComponent
      className={transparentCanvas ? 'transparent-canvas' : ''}
      autoFocus
      store={store}
      onMount={handleMount}
      components={{
        ErrorFallback: ({ error, editor }) => <ErrorFallback editor={editor} error={error} refresh={refresh} />,
      }}
      hideUi={editor?.getInstanceState()?.isReadonly}
      initialState={editor?.getInstanceState()?.isReadonly ? 'hand' : 'select'}
    />
  );
}

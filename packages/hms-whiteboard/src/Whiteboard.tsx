import React, { useState } from 'react';
import {
  AssetRecordType,
  createShapeId,
  Editor,
  getHashForString,
  MediaHelpers,
  TLAsset,
  Tldraw,
} from '@tldraw/tldraw';
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

    editor.updateShapes(
      editor.getSelectedShapes().map(shape => {
        return {
          ...shape,
          props: {
            ...shape.props,
            size: '',
          },
        };
      }),
    );

    const url = `https://media.istockphoto.com/id/1471999877/photo/man-hand-on-laptop-with-exclamation-mark-on-virtual-screen-online-safety-warning-caution.jpg?s=2048x2048&w=is&k=20&c=cqqBdO0bO7ODVGawy0ZK7LMwWfbDS09l4uofqu7P6mw=`;

    const assetId = AssetRecordType.createId(getHashForString(url));

    MediaHelpers.getImageSizeFromSrc(url).then(size => {
      const asset: TLAsset = AssetRecordType.create({
        id: assetId,
        type: 'image',
        typeName: 'asset',
        props: {
          name: 'prebuilt',
          src: url,
          w: size.w,
          h: size.h,
          mimeType: 'image/png',
          isAnimated: false,
        },
      });
      console.log({ asset });
      editor.createAssets([asset]);

      const shapeId = createShapeId();
      editor.createShape({
        id: shapeId,
        type: 'image',
        x: 0,
        y: 0,
        isLocked: true,
        props: {
          w: editor.getViewportPageBounds().width,
          h: editor.getViewportPageBounds().height,
          assetId,
        },
      });
    });
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
    />
  );
}

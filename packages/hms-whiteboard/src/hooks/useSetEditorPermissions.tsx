import { useEffect, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import decodeJWT from '../utils';

export const useSetEditorPermissions = ({
  token,
  editor,
  zoomToContent = false,
  handleError,
}: {
  token?: string;
  editor?: Editor;
  zoomToContent?: boolean;
  handleError: (error: Error) => void;
}) => {
  const { permissions } = useMemo(() => {
    try {
      return decodeJWT(token);
    } catch (err) {
      handleError(err as Error);
      return {};
    }
  }, [token, handleError]);

  useEffect(() => {
    // disable scroll and zoom
    editor?.updateInstanceState({ canMoveCamera: !!zoomToContent });

    if (!permissions) {
      return;
    }

    const isReadonly = !permissions.includes('write');
    editor?.updateInstanceState({ isReadonly });
  }, [permissions, zoomToContent, editor]);

  return permissions;
};

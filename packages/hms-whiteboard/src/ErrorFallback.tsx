import React, { ComponentType, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useValue } from '@tldraw/state';
import { Editor, hardResetEditor } from '@tldraw/tldraw';
import classNames from 'classnames';

const DASHBOARD_URL = 'https://dashboard.100ms.live/dashboard';

export type TLErrorFallbackComponent = ComponentType<{
  error: unknown;
  refresh: () => void;
  editor?: Editor;
}>;

export const ErrorFallback: TLErrorFallbackComponent = ({ error, editor, refresh }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldShowError, setShouldShowError] = useState(process.env.NODE_ENV !== 'production');
  const [didCopy, setDidCopy] = useState(false);
  const [shouldShowResetConfirmation, setShouldShowResetConfirmation] = useState(false);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : null;

  useEffect(() => {
    console.error('Whiteboard ErrorFallback:', errorMessage, errorStack);
  }, [errorMessage, errorStack]);

  const isDarkModeFromApp = useValue(
    'isDarkMode',
    () => {
      try {
        if (editor) {
          return editor.user.getIsDarkMode();
        }
      } catch {
        // we're in a funky error state so this might not work for spooky
        // reasons. if not, we'll have another attempt later:
      }
      return null;
    },
    [editor],
  );
  const [
    ,
    // isDarkMode
    setIsDarkMode,
  ] = useState<null | boolean>(null);
  useLayoutEffect(() => {
    // if we found a theme class from the app, we can just use that
    if (isDarkModeFromApp !== null) {
      setIsDarkMode(isDarkModeFromApp);
    }

    // do any of our parents have a theme class? if yes then we can just
    // rely on that and don't need to set our own class
    let parent = containerRef.current?.parentElement;
    let foundParentThemeClass = false;
    while (parent) {
      if (parent.classList.contains('tl-theme__dark') || parent.classList.contains('tl-theme__light')) {
        foundParentThemeClass = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (foundParentThemeClass) {
      setIsDarkMode(null);
      return;
    }

    // if we can't find a theme class from the app or from a parent, we have
    // to fall back on using a media query:
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, [isDarkModeFromApp]);

  useEffect(() => {
    if (didCopy) {
      const timeout = setTimeout(() => {
        setDidCopy(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [didCopy]);

  const copyError = () => {
    const textarea = document.createElement('textarea');
    textarea.value = errorStack ?? errorMessage;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setDidCopy(true);
  };

  const resetLocalState = async () => {
    hardResetEditor();
  };

  return (
    <div
      ref={containerRef}
      className={classNames(
        'tl-container tl-error-boundary',
        // error-boundary is sometimes used outside of the theme
        // container, so we need to provide it with a theme for our
        // styles to work correctly
        // 100ms: default light theme
        // isDarkMode === null ? '' : isDarkMode ? 'tl-theme__dark' : 'tl-theme__light',
        'tl-theme__light',
      )}
      style={{ position: 'static' }}
    >
      <div className="tl-error-boundary__overlay" />
      {/* {editor && (
        // opportunistically attempt to render the canvas to reassure
        // the user that their document is still there. there's a good
        // chance this won't work (ie the error that we're currently
        // notifying the user about originates in the canvas) so it's
        // not a big deal if it doesn't work - in that case we just have
        // a plain grey background.
        <ErrorBoundary onError={noop} fallback={() => null}>
          <EditorContext.Provider value={editor}>
            <div className="tl-overlay tl-error-boundary__canvas">
              <Canvas />
            </div>
          </EditorContext.Provider>
        </ErrorBoundary>
      )} */}
      <div
        className={classNames('tl-modal', 'tl-error-boundary__content', {
          'tl-error-boundary__content__expanded': shouldShowError && !shouldShowResetConfirmation,
        })}
      >
        {shouldShowResetConfirmation ? (
          <>
            <h2>Are you sure?</h2>
            <p>Resetting your data will delete your drawing and cannot be undone.</p>
            <div className="tl-error-boundary__content__actions">
              <button onClick={() => setShouldShowResetConfirmation(false)}>Cancel</button>
              <button className="tl-error-boundary__reset" onClick={resetLocalState}>
                Reset data
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Something&apos;s gone wrong.</h2>
            <p>
              Sorry, we encountered an error. Please refresh the page to continue. If you keep seeing this error, you
              can <a href={DASHBOARD_URL}>ask for help on Dashboard</a>.
            </p>
            {shouldShowError && (
              <div className="tl-error-boundary__content__error">
                <pre>
                  <code>{errorStack ?? errorMessage}</code>
                </pre>
                <button onClick={copyError}>{didCopy ? 'Copied!' : 'Copy'}</button>
              </div>
            )}
            <div className="tl-error-boundary__content__actions">
              <button onClick={() => setShouldShowError(!shouldShowError)}>
                {shouldShowError ? 'Hide details' : 'Show details'}
              </button>
              <div className="tl-error-boundary__content__actions__group">
                <button className="tl-error-boundary__refresh" onClick={refresh}>
                  Refresh
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

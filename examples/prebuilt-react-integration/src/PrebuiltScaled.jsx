/* eslint-disable react/prop-types -- demo repro page, prop-types add only noise */
import { useLayoutEffect } from 'react';
import { HMSPrebuilt, globalCss, theme } from '@100mslive/roomkit-react';

// room code is the path segment after /prebuilt-scaled/
function getRoomCode() {
  return window.location.pathname.replace(/^\/prebuilt-scaled\/?/, '').split('/')[0] || null;
}

/**
 * Full-prebuilt repro for the Newton School thread (Slack C03CXCKJ98W).
 *
 * Mirrors their setup: the host app's root is `html { font-size: 62.5% }`
 * (1rem = 10px) and the WHOLE <HMSPrebuilt> is embedded inside a host
 * container. Lets you flip between fix strategies via the URL so you can see
 * what each one does to the entire UI (not just the chat textarea).
 *
 *   /prebuilt-scaled/<room-code>?fix=none      -> baseline (everything under-scaled)
 *   /prebuilt-scaled/<room-code>?fix=wrapper   -> font-size:16px on the prebuilt root container
 *   /prebuilt-scaled/<room-code>?fix=override  -> rem-token rescale (the override from the thread)
 *   /prebuilt-scaled/<room-code>?fix=both      -> wrapper + override
 *   /prebuilt-scaled/<room-code>?fix=html      -> html root set to 16px (full fix, but breaks legacy host)
 *
 * Why each behaves the way it does:
 *  - rem tokens resolve against the document root (<html>), so only `fix=html`
 *    or the token `override` rescales them. A 16px on the prebuilt container
 *    (`wrapper`) does NOT touch rem.
 *  - the chat textarea (ChatFooter.tsx, `fontSize: 100%`) is parent-relative,
 *    so only `wrapper` (or `html`) fixes it; the token `override` does nothing
 *    for it.
 *  => neither `wrapper` nor `override` alone is complete; `both` is.
 */

// rem-token rescale override (same logic shared in the thread), scoped to :root
const SCALED_GROUPS = ['fontSizes', 'lineHeights', 'space', 'radii'];
function buildScaleOverrides() {
  const overrides = { '--hms-scale': '1.6' };
  for (const group of SCALED_GROUPS) {
    const tokenGroup = theme[group];
    for (const token of Object.values(tokenGroup)) {
      const { value, variable } = token;
      if (typeof value === 'string' && /rem$/.test(value) && value !== '0rem') {
        overrides[variable] = `calc(${value} * var(--hms-scale))`;
      }
    }
  }
  return overrides;
}
const applyTokenOverride = globalCss({ ':root': buildScaleOverrides() });

function getFixMode() {
  return new URLSearchParams(window.location.search).get('fix') || 'none';
}

const MODES = ['none', 'wrapper', 'override', 'both', 'html'];

function ControlBar({ mode, roomCode }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '6px 10px',
        background: '#0d1117',
        color: '#e6edf3',
        fontFamily: 'sans-serif',
        fontSize: 13,
        borderBottom: '1px solid #30363d',
      }}
    >
      <span>host root: 62.5% (1rem=10px) · fix:</span>
      {MODES.map(m => (
        <a
          key={m}
          href={`/prebuilt-scaled/${roomCode}?fix=${m}`}
          style={{
            color: m === mode ? '#0d1117' : '#58a6ff',
            background: m === mode ? '#3fb950' : 'transparent',
            padding: '2px 8px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: m === mode ? 700 : 400,
          }}
        >
          {m}
        </a>
      ))}
    </div>
  );
}

export default function PrebuiltScaled() {
  const roomCode = getRoomCode();
  const mode = getFixMode();
  const useWrapper = mode === 'wrapper' || mode === 'both';
  const useOverride = mode === 'override' || mode === 'both';

  useLayoutEffect(() => {
    const prevRoot = document.documentElement.style.fontSize;
    // mimic the host app: root at 62.5% unless we are testing the html-root fix
    document.documentElement.style.fontSize = mode === 'html' ? '16px' : '62.5%';
    if (useOverride) applyTokenOverride();
    return () => {
      document.documentElement.style.fontSize = prevRoot;
    };
  }, [mode, useOverride]);

  if (!roomCode) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h3>Add a room code to the URL</h3>
        <p>
          e.g. <code>/prebuilt-scaled/abc-defg-hij?fix=wrapper</code>
        </p>
      </div>
    );
  }

  // the prebuilt is embedded inside a host container, exactly like Newton School.
  const prebuilt = <HMSPrebuilt roomCode={roomCode} />;

  return (
    <>
      <ControlBar mode={mode} roomCode={roomCode} />
      <div
        style={{
          // the "host app" area around the embed, at the 62.5% root
          paddingTop: 40,
          height: '100%',
          boxSizing: 'border-box',
          background: '#161b22',
        }}
      >
        <div
          // the embed container that holds the whole prebuilt.
          // fix=wrapper sets font-size:16px here (on the prebuilt root container).
          style={{
            height: 'calc(100% - 0px)',
            ...(useWrapper ? { fontSize: '16px' } : null),
          }}
        >
          {prebuilt}
        </div>
      </div>
    </>
  );
}

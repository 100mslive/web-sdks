/* eslint-disable react/prop-types -- throwaway repro page, prop-types add only noise */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Flex, globalCss, styled, theme } from '@100mslive/roomkit-react';

/**
 * Repro for the Newton School thread (Slack C03CXCKJ98W).
 *
 * The host app sets `html { font-size: 62.5% }` (1rem = 10px). roomkit-react is
 * authored against a 16px root. Two different style classes break differently:
 *
 *  1. rem-based tokens ($md, $space, ...) under-scale because rem is ROOT-relative.
 *     Fix = redefine the token CSS vars as calc(value * 1.6). This is the override
 *     already shared in the thread.
 *
 *  2. The chat textarea (Prebuilt/components/Chat/ChatFooter.tsx) uses
 *     `fontSize: '100%'`. `%` is PARENT-relative (like em), so the token override
 *     does nothing for it — it inherits the 10px root and renders tiny.
 *
 * The claim under test: wrapping the subtree in an element with an explicit
 * `font-size: 16px` fixes the `%`/em case, because the chat textarea's ancestor
 * chain (Box -> Flex -> Flex -> textarea) is pure layout primitives that never
 * set font-size, so a wrapper font-size cascades all the way down.
 *
 * This page reproduces the exact constructs and prints the COMPUTED font-size for
 * each scenario so the claim can be verified empirically rather than asserted.
 */

// --- the two style classes, mirroring roomkit ---
// chat textarea: ChatFooter.tsx uses fontSize: '100%'
const PercentTextArea = styled('textarea', {
  fontSize: '100%',
  fontFamily: '$sans',
  width: '100%',
  resize: 'none',
});
// everything else: rem token, e.g. TextArea/TextArea.tsx uses fontSize: '$md'
const RemTextArea = styled('textarea', {
  fontSize: '$md',
  fontFamily: '$sans',
  width: '100%',
  resize: 'none',
});

// --- the token-rescale override, scoped to a class so override-on and
// override-off subtrees can coexist on one page (in the thread it targets :root) ---
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
const applyScaleClass = globalCss({ '.hms-scaled': buildScaleOverrides() });

// reproduce the chat textarea ancestry: Box -> Flex -> Flex -> textarea
function ChatAncestry({ children }) {
  return (
    <Box css={{ position: 'relative' }}>
      <Flex>
        <Flex align="center" css={{ gap: '$4', w: '100%' }}>
          {children}
        </Flex>
      </Flex>
    </Box>
  );
}

function Measured({ label, expectation, wrapperPx, TextAreaComp }) {
  const ref = useRef(null);
  const [px, setPx] = useState('…');
  // runs after the parent's layout effect has set the 62.5% root, so the read is accurate
  useEffect(() => {
    if (ref.current) setPx(getComputedStyle(ref.current).fontSize);
  }, []);
  const inner = (
    <ChatAncestry>
      <TextAreaComp ref={ref} rows={1} defaultValue="Type a message…" />
    </ChatAncestry>
  );
  return (
    <div style={{ border: '1px solid #888', borderRadius: 8, padding: 12, marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{expectation}</div>
      {wrapperPx ? <div style={{ fontSize: `${wrapperPx}px` }}>{inner}</div> : inner}
      <div style={{ marginTop: 8, fontFamily: 'monospace' }}>
        computed font-size: <b style={{ color: px === '16px' ? '#3fb950' : '#f0883e' }}>{px}</b>
      </div>
    </div>
  );
}

export default function FontScaleRepro() {
  // mimic the host app: html { font-size: 62.5% } (1rem = 10px)
  useLayoutEffect(() => {
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = '62.5%';
    applyScaleClass(); // stitches globalCss is idempotent; scoped to .hms-scaled
    return () => {
      document.documentElement.style.fontSize = prev;
    };
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, color: '#e6edf3', background: '#0d1117', minHeight: '100%', fontFamily: 'sans-serif' }}>
      <h2>Font-size cascade repro — host root at 62.5% (1rem = 10px)</h2>
      <p style={{ color: '#aaa' }}>
        Intended size is <b>16px</b> (green). Each box reproduces the chat textarea
        construct nested in roomkit layout primitives. <code>.hms-scaled</code> = the
        token-rescale override is active for that subtree.
      </p>

      <div className="hms-scaled">
        <Measured
          label="A. chat textarea (fontSize 100%) — override ON, no wrapper"
          expectation="% is parent-relative; token override does nothing → inherits 10px root → tiny. This is the bug."
          TextAreaComp={PercentTextArea}
        />
        <Measured
          label="B. chat textarea (fontSize 100%) — override ON + wrapper font-size:16px"
          expectation="Wrapper cascades through Box/Flex (no intermediate font-size) → 100% resolves to 16px. The proposed fix."
          wrapperPx={16}
          TextAreaComp={PercentTextArea}
        />
        <Measured
          label="C. rem textarea (fontSize $md) — override ON, no wrapper"
          expectation="rem is root-relative; override rescales the token → 16px. (rem class is fixed by override alone.)"
          TextAreaComp={RemTextArea}
        />
      </div>

      <Measured
        label="D. rem textarea (fontSize $md) — wrapper font-size:16px only, NO override"
        expectation="Wrapper does NOT affect rem (root-relative) → stays ~10px. Proves wrapper alone can't fix rem."
        wrapperPx={16}
        TextAreaComp={RemTextArea}
      />
      <Measured
        label="E. chat textarea (fontSize 100%) — no override, no wrapper"
        expectation="Baseline broken state → inherits 10px root."
        TextAreaComp={PercentTextArea}
      />
    </div>
  );
}

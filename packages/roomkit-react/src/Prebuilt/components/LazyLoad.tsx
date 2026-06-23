import React, { FunctionComponent, lazy, ReactNode, Suspense } from 'react';

/**
 * Code-splitting helpers for roomkit-react.
 *
 * Background: roomkit-react ships ESM with esbuild `splitting: true`, but the library
 * itself has historically emitted zero internal chunks. A previous broad lazy-load attempt
 * (#3010) was reverted because it (a) flipped the asset loader to hardcoded runtime paths
 * and (b) lazy-loaded the main conference path. These helpers keep splitting bundler-agnostic:
 * we only ever use a relative `import()` of our own modules / a dynamic `import()` of external
 * deps. The consumer's bundler re-resolves and re-chunks them at build time, exactly like the
 * already-working `copy` asset loader. We never reference a hardcoded runtime chunk path.
 *
 * Split only heavy AND conditional/rare surfaces — never the join/preview/conference path.
 */

/**
 * Retries a dynamic import once after a short delay. Covers transient network blips and the
 * stale-chunk-after-redeploy case. A genuine misconfiguration (e.g. wrong publicPath -> 404)
 * still fails after the retry, where the {@link ChunkLoadErrorBoundary} takes over.
 */
export function retryImport<T>(factory: () => Promise<T>, retries = 1, interval = 400): Promise<T> {
  return factory().catch((error: unknown) => {
    if (retries <= 0) {
      throw error;
    }
    return new Promise<void>(resolve => setTimeout(resolve, interval)).then(() =>
      retryImport(factory, retries - 1, interval),
    );
  });
}

type ChunkLoadErrorBoundaryProps = {
  fallback?: ReactNode;
  children: ReactNode;
};

type ChunkLoadErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Renders `fallback` (default: nothing) instead of crashing the whole app when a lazy chunk
 * cannot be loaded even after a retry. This is the graceful-degradation backstop for the
 * cross-bundler chunk-404 risk that broke the previous attempt.
 */
export class ChunkLoadErrorBoundary extends React.Component<ChunkLoadErrorBoundaryProps, ChunkLoadErrorBoundaryState> {
  state: ChunkLoadErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChunkLoadErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('roomkit-react: failed to load a lazily-loaded chunk', error);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback ?? null}</>;
    }
    return this.props.children;
  }
}

/**
 * Lazy-loads a component and wraps it in a Suspense boundary + chunk-load error boundary.
 *
 * Use a real `loading` fallback (e.g. <FullPageProgress />) for full-surface swaps; never an
 * empty fragment for those. `error` defaults to `loading` so a permanently-failing chunk
 * degrades gracefully instead of white-screening the app.
 *
 * @example
 * const HLSView = lazyWithSuspense(() => import('./HLSView'), { loading: <FullPageProgress /> });
 * // named export:
 * const VBPicker = lazyWithSuspense(
 *   () => import('../VirtualBackground/VBPicker').then(m => ({ default: m.VBPicker })),
 *   { loading: <FullPageProgress /> },
 * );
 */
// `P` is the component's props. For named exports remapped via `.then(m => ({ default: m.X }))`,
// pass `P` explicitly at the call site (e.g. `lazyWithSuspense<MyProps>(...)`) — inferring it
// through that callback can collapse the props to `never`. Default exports infer cleanly.
export function lazyWithSuspense<P extends object>(
  factory: () => Promise<{ default: FunctionComponent<P> }>,
  options: { loading?: ReactNode; error?: ReactNode } = {},
): React.FC<P> {
  const { loading = null, error } = options;
  // Cast to React.FC<P> so the wrapper can render it with statically-typed props (the
  // LazyExoticComponent's PropsWithRef signature otherwise rejects a generic `P` spread).
  const LazyComponent = lazy(() => retryImport(factory)) as unknown as React.FC<P>;

  const Wrapped: React.FC<P> = props => (
    <ChunkLoadErrorBoundary fallback={error ?? loading}>
      <Suspense fallback={loading}>
        <LazyComponent {...props} />
      </Suspense>
    </ChunkLoadErrorBoundary>
  );
  Wrapped.displayName = 'lazyWithSuspense';
  return Wrapped;
}

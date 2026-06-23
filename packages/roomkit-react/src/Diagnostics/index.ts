import { createElement } from 'react';
import FullPageProgress from '../Prebuilt/components/FullPageProgress';
import { lazyWithSuspense } from '../Prebuilt/components/LazyLoad';

// Diagnostics is a standalone pre-call connectivity tool, separate from the conference flow.
// Lazy-load it so consumers that render it only on a dedicated route don't pay for it upfront.
// The public API is unchanged: `Diagnostics` is still a prop-less component consumers can render.
export const Diagnostics = lazyWithSuspense<Record<string, never>>(
  () => import('./Diagnostics').then(m => ({ default: m.Diagnostics })),
  { loading: createElement(FullPageProgress) },
);

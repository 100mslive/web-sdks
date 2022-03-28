import { observe } from 'react-intersection-observer';
import type { IntersectionOptions } from 'react-intersection-observer';
import { Accessor, createEffect, createSignal } from 'solid-js';

type State = {
  inView: boolean;
  entry?: IntersectionObserverEntry;
};

type CustomInViewHookRespone = {
  ref: (node?: Element | null) => void;
  inView: boolean;
  entry?: IntersectionObserverEntry;
};

/**
 * React Hooks make it easy to monitor the `inView` state of your components. Call
 * the `useInView` hook with the (optional) [options](#options) you need. It will
 * return an array containing a `ref`, the `inView` status and the current
 * [`entry`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserverEntry).
 * Assign the `ref` to the DOM element you want to monitor, and the hook will
 * report the status.
 *
 * @example
 * ```jsx
 * import React from 'react';
 * import { useInView } from 'react-intersection-observer';
 *
 * const Component = () => {
 *   const { ref, inView, entry } = useInView({
 *       threshold: 0,
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       <h2>{`Header inside viewport ${inView}.`}</h2>
 *     </div>
 *   );
 * };
 * ```
 */
export function useInView(props: IntersectionOptions): Accessor<CustomInViewHookRespone> {
  let unobserve: (() => void) | undefined;
  const [state, setState] = createSignal<State>({
    inView: !!props.initialInView,
  });
  const setRef = (node?: Element | null) => {
    if (unobserve !== undefined) {
      unobserve();
      unobserve = undefined;
    }

    // Skip creating the observer
    if (props.skip) {
      return;
    }

    if (node) {
      unobserve = observe(
        node,
        (inView, entry) => {
          setState({ inView, entry });

          if (entry.isIntersecting && props.triggerOnce && unobserve) {
            // If it should only trigger once, unobserve the element after it's inView
            unobserve();
            unobserve = undefined;
          }
        },
        {
          root: props.root,
          rootMargin: props.rootMargin,
          threshold: props.threshold,
          // @ts-ignore
          trackVisibility: props.trackVisibility,
          delay: props.delay,
        },
        props.fallbackInView,
      );
    }
  };

  createEffect(() => {
    if (!unobserve && state().entry && !props.triggerOnce && !props.skip) {
      // If we don't have a ref, then reset the state (unless the hook is set to only `triggerOnce` or `skip`)
      // This ensures we correctly reflect the current state - If you aren't observing anything, then nothing is inView
      setState({
        inView: !!props.initialInView,
      });
    }
  });

  // const result = [setRef, state().inView, state().entry] as InViewHookResponse;

  const result: Accessor<CustomInViewHookRespone> = () => ({
    ref: setRef,
    inView: state().inView,
    entry: state().entry,
  });
  return result;
}

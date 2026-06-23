/**
 * Lazily loads the emoji-mart apple emoji set (~470 KB JSON) and the emoji-mart core, then
 * runs `init({ data })`. Previously `EmojiReaction.jsx` did `import data` + `init({ data })` at
 * module scope, forcing the 470 KB set into the consumer's initial bundle for every session —
 * even those that never use reactions.
 *
 * Both the send path (EmojiCard) and the receive path (FlyingEmoji renders incoming reactions
 * from remote peers) rely on emoji-mart being initialized before any <em-emoji> renders, so
 * every <em-emoji> render site must await {@link ensureEmojiData} first. The promise is cached,
 * so concurrent/repeat callers share a single load + init.
 */
let initPromise: Promise<void> | null = null;
let ready = false;

export function ensureEmojiData(): Promise<void> {
  if (ready) {
    return Promise.resolve();
  }
  if (!initPromise) {
    initPromise = Promise.all([import('@emoji-mart/data/sets/14/apple.json'), import('emoji-mart')])
      .then(([data, { init }]) => init({ data: data.default }))
      .then(() => {
        ready = true;
      })
      .catch(error => {
        // Allow a later caller to retry instead of caching the failure forever.
        initPromise = null;
        throw error;
      });
  }
  return initPromise;
}

export function isEmojiDataReady(): boolean {
  return ready;
}

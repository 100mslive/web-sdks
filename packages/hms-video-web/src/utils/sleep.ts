/**
 * Delay for a @see ms amount of time
 * @param ms -- time in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  if (ms <= 0) throw Error('`ms` should be a positive integer');
  return new Promise((resolve) => setTimeout(resolve, ms));
}

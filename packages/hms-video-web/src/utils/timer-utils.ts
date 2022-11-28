/**
 * Delay for a @see ms amount of time
 * @param ms -- time in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  if (ms < 0) {
    throw Error('`ms` should be a positive integer');
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce Fn - Function to limit the number of executions of the passed in
 * function in a given time duration
 * @param fn Function to be called
 * @param delay time by which the function execution has to be delayed
 * @returns {void}
 */
export function debounce<T extends (...args: any) => any>(fn: T, delay = 300) {
  let timer: any | undefined;
  return function (...args: []) {
    clearTimeout(timer);
    timer = undefined;
    //@ts-ignore
    //eslint-disable-next-line
    const context = this;
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

export interface PromiseCallbacks<T, K = void> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  metadata?: K;
}

export class PromiseWithCallbacks<T> {
  promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (reason?: any) => void;

  constructor(cb: (resolve: (value: T) => void, reject: (reason?: any) => void) => any) {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      cb(resolve, reject);
    });
  }
}

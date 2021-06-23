export interface PromiseCallbacks<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
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

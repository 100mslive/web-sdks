export interface PromiseCallbacks<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

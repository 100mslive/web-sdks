export interface ISignalParamsProvider<T extends Object> {
  toSignalParams(): T;
}

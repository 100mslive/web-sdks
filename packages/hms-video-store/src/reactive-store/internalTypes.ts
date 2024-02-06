import { PartialState, State } from 'zustand/vanilla';

export type NamedSetState<T extends State> = {
  <K1 extends keyof T, K2 extends keyof T = K1, K3 extends keyof T = K2, K4 extends keyof T = K3>(
    partial: PartialState<T, K1, K2, K3, K4>,
    name: string,
  ): void;
};

// start from a new fake store for every test
import { localVideo, makeFakeStore } from '../fakeStore';
import { HMSStore, selectIsLocalVideoPluginPresent } from '../../core';

let fakeStore: HMSStore;

beforeEach(() => {
  fakeStore = makeFakeStore();
});
describe('test selectors by reference', () => {
  test('select is plugin present', () => {
    localVideo.plugins = ['plugin1', 'plugin2'];
    expect(selectIsLocalVideoPluginPresent('plugin1')(fakeStore)).toBe(true);
    expect(selectIsLocalVideoPluginPresent('plugin2')(fakeStore)).toBe(true);
    expect(selectIsLocalVideoPluginPresent('plugin3')(fakeStore)).toBe(false);
  });
});

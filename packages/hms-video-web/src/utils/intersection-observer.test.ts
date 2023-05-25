import { HMSIntersectionObserverWrapper } from './intersection-observer';

describe('intersection observer', () => {
  test('observe element', () => {
    const wrapper = new HMSIntersectionObserverWrapper();
    const element = document.createElement('div');
    const callback = jest.fn();
    wrapper.observe(element, callback);
    wrapper['handleIntersection']([{ target: element } as unknown as IntersectionObserverEntry]);
    expect(callback).toHaveBeenCalled();
  });

  test('unobserve element', () => {
    const wrapper = new HMSIntersectionObserverWrapper();
    const element = document.createElement('div');
    const callback = jest.fn();
    wrapper.observe(element, callback);
    wrapper.unobserve(element);
    expect(wrapper['listeners'].has(element)).toBe(false);
  });

  test('intersection observer not supported', () => {
    const wrapper = new HMSIntersectionObserverWrapper();
    // @ts-ignore
    window.IntersectionObserver = undefined;
    const result = wrapper.isSupported();
    expect(result).toBe(false);
    expect(wrapper['intersectionObserver']).toBeUndefined();
  });

  test('observe multiple elements callbacks', () => {
    const wrapper = new HMSIntersectionObserverWrapper();
    const element = document.createElement('div');
    const element2 = document.createElement('div');
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    wrapper.observe(element, callback1);
    wrapper.observe(element2, callback2);
    wrapper['handleIntersection']([
      { target: element } as unknown as IntersectionObserverEntry,
      { target: element2 } as unknown as IntersectionObserverEntry,
    ]);
    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });
});

import { RunningAverage } from './math';

describe('RunningAverage', () => {
  it('returns 0 when no sample has been added', () => {
    expect(new RunningAverage().getAvg()).toBe(0);
  });

  it('returns 0 after being reset', () => {
    const average = new RunningAverage();
    average.add(10);
    average.reset();
    expect(average.getAvg()).toBe(0);
  });

  it('floors the average of the added samples', () => {
    const average = new RunningAverage();
    average.add(1);
    average.add(2);
    expect(average.getAvg()).toBe(1);
  });
});

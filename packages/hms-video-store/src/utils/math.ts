export class RunningAverage {
  private total = 0;
  private count = 0;

  add(item: number) {
    this.count++;
    this.total += item;
  }

  getAvg(): number {
    if (this.count === 0) {
      return 0;
    }
    return Math.floor(this.total / this.count);
  }

  reset() {
    this.total = 0;
    this.count = 0;
  }
}

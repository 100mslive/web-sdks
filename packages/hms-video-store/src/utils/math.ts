export class RunningAverage {
  private total = 0;
  private count = 0;

  add(item: number) {
    this.count++;
    this.total += item;
  }

  getAvg(): number {
    return Math.floor(this.total / this.count);
  }

  reset() {
    this.total = 0;
    this.count = 0;
  }
}

export class CQSCalculator {
  private networkScores: number[] = [];
  private lastPushedAt = 0;

  pushScore(score?: number) {
    if (!score || score < 0) {
      return;
    }

    if (this.networkScores.length === 0) {
      this.networkScores.push(score);
      this.lastPushedAt = Date.now();
    } else {
      this.addPendingCQSTillNow();
    }
  }

  addPendingCQSTillNow() {
    if (this.networkScores.length > 0) {
      let timeDiffInSec = (Date.now() - this.lastPushedAt) / 1000;
      while (timeDiffInSec > 0) {
        this.networkScores.push(this.networkScores[this.networkScores.length - 1]);
        timeDiffInSec -= 1;
      }

      this.lastPushedAt = Date.now();
    }
  }

  getCQS() {
    return this.networkScores.reduce((acc, score) => acc + score, 0) / this.networkScores.length;
  }
}

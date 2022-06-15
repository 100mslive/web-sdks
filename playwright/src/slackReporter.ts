import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStatus,
} from "@playwright/test/reporter";
import { writeFileSync } from "fs";
import * as HandleBars from "handlebars";

class slackReporter implements Reporter {
  private message = "";
  private counters: Record<TestStatus | "flaky", number> = {
    failed: 0,
    passed: 0,
    skipped: 0,
    timedOut: 0,
    flaky: 0,
  };
  private flaky: string[] = [];
  private failures: string[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.addCountToMessage("Total", suite.allTests().length);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    // test is flaky when it had some failures but passed in retries
    if (test.outcome() === "flaky") {
      this.counters.failed--;
      this.failures = this.failures.filter((title) => title !== test.title);
      this.counters.flaky++;
      this.flaky.push(test.title);
    } else if (result.status === "failed" && !this.failures.includes(test.title)) {
      this.counters.failed++;
      this.failures.push(test.title);
    } else if (result.status !== "failed") {
      this.counters[result.status]++;
    }
    console.log(`Finished test ${test.title}: ${result.status}`);
  }

  onEnd(result: FullResult): void {
    Object.entries(this.counters).forEach(([status, statusCount]) => {
      this.addCountToMessage(status, statusCount);
    });

    if (this.counters["failed"] > 0) {
      slackPayload.attachments[0].color = "#af0e20";
      this.message += "\n*Failed Tests - *\n";
      this.message += `${this.failures.join("\n")}\n`;
    }
    if (this.counters["flaky"] > 0) {
      this.message += "\n*Flaky Tests - *\n";
      this.message += `${this.flaky.join("\n")}\n`;
    }

    console.log(`Finished the run: ${result.status}`);
    slackText.text = this.message;
    let slackJson = JSON.stringify(slackPayload, null, 2);
    const emoji = result.status === "passed" ? ":tada:" : ":cry:";
    slackJson = this.interpolateSlackTemplate(slackJson, { jobStatus: result.status, emoji });
    console.log("slack message payload", slackJson);
    writeFileSync("slackMessage.json", slackJson);
  }

  interpolateSlackTemplate(payload: string, variables: Record<string, string>) {
    payload = payload.replaceAll("$", "");
    const context = {
      env: process.env,
      ...variables,
    };
    const template = HandleBars.compile(payload);
    return template(context);
  }

  addCountToMessage(label: string, count: number) {
    if (count) {
      this.message += `*${label}:*  ${count}\n`;
    }
  }
}

const slackText = {
  type: "mrkdwn",
  text: "",
};

const slackPayload = {
  attachments: [
    {
      color: "#1cba2c",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Web-Automation results for ${{env.REGION}}: ${{jobStatus}} ${{emoji}}*",
          },
        },
        {
          type: "section",
          text: slackText,
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Test Run",
                emoji: true,
              },
              url: "${{env.GITHUB_SERVER_URL}}/${{env.GITHUB_REPOSITORY}}/actions/runs/${{env.GITHUB_RUN_ID}}",
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Results",
                emoji: true,
              },
              url: "https://web-automation-git-${{env.REGION}}-100mslive.vercel.app/",
            },
          ],
        },
      ],
    },
  ],
};

export default slackReporter;

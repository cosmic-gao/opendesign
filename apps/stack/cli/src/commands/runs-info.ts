import chalk from "chalk";
import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster, selectRun } from "../utils";

interface RunInfoArgs {
  cluster?: string;
  run?: string;
}

export const RunInfo: CommandModule<{}, RunInfoArgs> = {
  command: "info",
  describe: "Display run information and timeline",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        alias: "c",
        type: "string",
        description: "Cluster ID",
      })
      .option("run", {
        alias: "r",
        type: "string",
        description: "Run ID",
      }),
  handler: async ({ cluster, run }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!run) {
      run = await selectRun(cluster);
      if (!run) {
        console.log("No run selected");
        return;
      }
    }

    await displayRunInfo(cluster, run);
  },
};

export async function displayRunInfo(clusterId: string, runId: string) {
  let isRunning = true;
  const printedIds = new Set<string>();

  console.log("Fetching Run information...");

  const fetchAndDisplayRunInfo = async () => {
    try {
      const response = await client.getRunTimeline({
        params: {
          clusterId,
          runId,
        },
      });

      if (response.status !== 200) {
        console.error(`Failed to fetch Run information: ${response.status}`);
        isRunning = false;
        return;
      }

      const result = response.body;
      const { run, jobs, messages, activity } = result;

      const timeline = [
        ...jobs.map((j) => ({
          id: j.id,
          color: chalk.blue,
          type: "job",
          content: `${j.service}.${j.targetFn}(): ${Object.entries({
            status: j.status,
            resultType: j.resultType,
          })
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")}`,
          createdAt: j.createdAt,
        })),
        ...messages.map((m) => ({
          id: m.id,
          color: chalk.green,
          type: `message (${m.type})`,
          content: `${JSON.stringify(m, null, 2)}`,
          createdAt: m.createdAt,
        })),
        ...activity.map((a) => ({
          id: a.id,
          color: chalk.cyan,
          type: "activity",
          content: `Event (${a.type}): ${Object.entries(a)
            .map(([k, v]) => `${k}=${v}`)
            .join(" ")}`,
          createdAt: a.createdAt,
        })),
      ].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

      timeline
        .filter((event) => !printedIds.has(event.id))
        .forEach((event) => {
          console.log(
            chalk.dim(
              `\n${new Date(event.createdAt).toLocaleString()} - ${event.type}`,
            ),
          );
          console.log(event.color(event.content) + "\n");
          printedIds.add(event.id);
        });
    } catch (error) {
      console.error("An error occurred while fetching workflow information");
      console.error(error);
      isRunning = false;
    }
  };

  // Initial fetch and display
  await fetchAndDisplayRunInfo();

  // Refresh every 5 seconds
  const intervalId = setInterval(fetchAndDisplayRunInfo, 5000);

  // Keep the process running
  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Clear the interval when the workflow is finished or an error occurs
  clearInterval(intervalId);
  console.log("Run information fetch completed.");
}

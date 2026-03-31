import { CommandModule } from "yargs";
import { selectCluster, selectRun } from "../utils";
import { openBrowser } from "../system";
import { readContext } from "../lib/context";

type OpenArgs = {
  clusterId?: string;
};

export const AppOpen: CommandModule<{}, OpenArgs> = {
  command: "app",
  aliases: ["playground"],
  describe: "Open the Inferable app in a browser",
  builder: (yargs) =>
    yargs.option("clusterId", {
      describe: "Cluster ID",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ clusterId }) => {
    if (!clusterId) {
      clusterId = await selectCluster();
      if (!clusterId) {
        console.log("No cluster selected");
        process.exit(1);
      }
    }

    openBrowser(`${readContext().appUrl}/clusters/${clusterId}`);
  },
};

type RunOpenArgs = OpenArgs & {
  runId?: string;
};

export const RunOpen: CommandModule<{}, RunOpenArgs> = {
  command: "open",
  describe: "Open a run in a browser",
  builder: (yargs) =>
    yargs
      .option("clusterId", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("runId", {
        describe: "Run ID",
        demandOption: false,
        type: "string",
      }),
  handler: async ({ clusterId, runId }) => {
    if (!clusterId) {
      clusterId = await selectCluster();
      if (!clusterId) {
        console.log("No cluster selected");
        process.exit(1);
      }
    }

    if (!runId) {
      runId = await selectRun(clusterId);
      if (!runId) {
        console.log("No run selected");
        process.exit(1);
      }
    }

    openBrowser(`${readContext().appUrl}/clusters/${clusterId}/runs/${runId}`);
  },
};

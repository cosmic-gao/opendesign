import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";
import { readContext } from "../lib/context";
import { getToken } from "../lib/auth";
import * as execa from "execa";

interface ShellArgs {
  script: string;
  user: boolean;
  clusterId?: string;
}

export const Shell: CommandModule<{}, ShellArgs> = {
  command: "shell [script]",
  aliases: ["shell", "s"],
  describe: "Run a shell command with Inferable authentication available",
  builder: (yargs) =>
    yargs
      .positional("script", {
        describe: "Script to run",
        demandOption: true,
        type: "string",
      })
      .option("user", {
        describe: "Attach user context rather than machine context",
        default: false,
        type: "boolean",
      })
      .option("cluster", {
        describe: "Cluster ID",
        type: "string",
      }),
  handler: async ({ script, clusterId, user }) => {
    if (!clusterId) {
      clusterId = await selectCluster();
      if (!clusterId) {
        console.log("No cluster selected");
        return;
      }
    }

    const clusterResults = await client.getCluster({
      params: {
        clusterId,
      },
    });

    if (clusterResults.status !== 200) {
      console.error(`Failed to get cluster details: ${clusterResults.status}`);
      return;
    }

    const apiURL = readContext().apiUrl;

    console.log(`Executing command: '${script}'...`);

    try {
      execa.sync("sh", ["-c", script], {
        cwd: process.cwd(),
        stdio: "inherit",
        env: {
          INFERABLE_API_ENDPOINT: apiURL,
          INFERABLE_CLUSTER_ID: clusterId,
        },
      });
    } catch (e: any) {
      if (!!e.exitCode) {
        process.exit(e.exitCode);
      }
      process.exit(1);
    }
  },
};

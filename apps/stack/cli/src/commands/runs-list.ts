import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import { client } from "../lib/client";

interface RunListArgs {
  cluster?: string;
  limit?: number;
}

export const RunList: CommandModule<{}, RunListArgs> = {
  command: "list",
  aliases: ["ls"],
  describe: "List runs for a cluster",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        alias: "c",
        type: "string",
        description: "Cluster ID",
      })
      .option("limit", {
        alias: "l",
        type: "number",
        description: "Limit the number of Runs returned",
        default: 10,
      }),
  handler: async ({ cluster, after, limit }) => {
    const clusterId = cluster || (await selectCluster());

    if (!clusterId) {
      console.error("No cluster selected");
      process.exit(1);
    }

    try {
      const response = await client.listRuns({
        params: {
          clusterId,
        },
        query: {
          limit,
        },
      });

      if (response.status !== 200) {
        console.error("Failed to fetch Runs", response.body);
        process.exit(1);
      }

      const runs = response.body.map((run) => ({
        id: run.id,
        name: run.name,
        status: run.status,
        createdAt: run.createdAt,
        test: run.test,
      }));

      if (runs.length === 0) {
        console.log("No runs found for this cluster.");
        return;
      }

      console.table(runs);
    } catch (error) {
      console.error("An error occurred while fetching runs:", error);
      process.exit(1);
    }
  },
};

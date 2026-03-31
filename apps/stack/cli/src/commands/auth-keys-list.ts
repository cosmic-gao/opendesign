import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import { listApiKeys } from "./auth-keys";

interface ApiKeysListArgs {
  cluster?: string;
}

export const ApiKeysList: CommandModule<{}, ApiKeysListArgs> = {
  command: "list",
  describe: "List all API keys for a cluster",
  builder: (yargs) =>
    yargs.option("cluster", {
      describe: "Cluster ID",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ cluster }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        process.exit(1);
      }
    }

    const keys = await listApiKeys(cluster);

    if (keys.length === 0) {
      console.log("No API keys found for this cluster.");
      return;
    }

    console.table(keys);
  },
};

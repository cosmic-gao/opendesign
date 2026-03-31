import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import { createApiKey } from "./auth-keys";
import path from "path";
import { appendFile } from "fs/promises";
import { existsSync } from "fs";

interface ApiKeysCreateArgs {
  clusterId?: string;
  name: string;
  env: boolean;
}

export const ApiKeysCreate: CommandModule<{}, ApiKeysCreateArgs> = {
  command: "create <name>",
  describe: "Create a new API key for a cluster",
  builder: (yargs) =>
    yargs
      .option("clusterId", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("env", {
        describe: "Populate .env file with API key",
        demandOption: false,
        type: "boolean",
        default: false,
      })
      .positional("name", {
        describe: "Name of the API key to create",
        demandOption: true,
        type: "string",
      }),
  handler: async ({ clusterId, name, env }) => {
    const envPath = path.resolve(".env");
    if (env) {
      if (existsSync(envPath)) {
        console.error(
          ".env file already exists. Please remove it and try again.",
        );
        process.exit(1);
      }
    }

    if (!clusterId) {
      clusterId = await selectCluster();
      if (!clusterId) {
        console.log("No cluster selected");
        return;
      }
    }

    const key = await createApiKey(clusterId, name);
    console.log(key);

    if (env) {
      await appendFile(envPath, `INFERABLE_API_SECRET=${key.key}\n`);
      await appendFile(envPath, `INFERABLE_CLUSTER_ID=${clusterId}\n`);
      console.log("API key populated in .env file");
    }
  },
};

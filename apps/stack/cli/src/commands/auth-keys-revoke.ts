import { CommandModule } from "yargs";
import { selectCluster } from "../utils";
import { authenticatedClient } from "../lib/client";
import { getToken } from "../lib/auth";
import { listApiKeys } from "./auth-keys";

interface ApiKeysRevokeArgs {
  cluster?: string;
  keyId?: string;
}

export const ApiKeysRevoke: CommandModule<{}, ApiKeysRevokeArgs> = {
  command: "revoke [keyId]",
  describe: "Revoke an API key for a cluster",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .positional("keyId", {
        describe: "ID of the API key to revoke",
        demandOption: false,
        type: "string",
      }),
  handler: async ({ cluster, keyId }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!keyId) {
      const keys = await listApiKeys(cluster);
      console.log("No key ID provided, please provide one of the following:");
      console.log(keys);
      process.exit(1);
    }

    await revokeAuthToken(cluster, keyId);
  },
};

export const revokeAuthToken = async (cluster: string, keyId: string) => {
  const response = await authenticatedClient().revokeApiKey({
    params: { clusterId: cluster, keyId },
    headers: {
      authorization: `bearer ${getToken()}`,
    },
  });

  if (response.status < 200 || response.status > 299) {
    console.error(`Failed to revoke API key: ${response.status}`);
    process.exit(1);
  } else {
    console.log(`API key ${keyId} revoked successfully.`);
  }
};

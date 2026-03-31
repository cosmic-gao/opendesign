import { CommandModule, showHelp } from "yargs";
import { ApiKeysList } from "./auth-keys-list";
import { ApiKeysRevoke } from "./auth-keys-revoke";
import { ApiKeysCreate } from "./auth-keys-create";
import { authenticatedClient } from "../lib/client";
import { getToken } from "../lib/auth";

export const ApiKeys: CommandModule<{}, {}> = {
  command: "keys",
  describe: "Manage Inferable API keys",
  builder: (yargs) =>
    yargs.command(ApiKeysList).command(ApiKeysRevoke).command(ApiKeysCreate),
  handler: () => {
    showHelp();
  },
};

export const listApiKeys = async (cluster: string) => {
  const response = await authenticatedClient().listApiKeys({
    params: { clusterId: cluster },
    headers: {
      authorization: `bearer ${getToken()}`,
    },
  });

  if (response.status !== 200) {
    console.error(`Failed to list API keys: ${response.status}`);
    process.exit(1);
  } else {
    return response.body;
  }
};

export const createApiKey = async (cluster: string, name: string) => {
  const response = await authenticatedClient().createApiKey({
    params: { clusterId: cluster },
    headers: {
      authorization: `bearer ${getToken()}`,
    },
    body: {
      name,
    },
  });

  if (response.status !== 200) {
    console.error(`Failed to create API key: ${response.status}`);
    process.exit(1);
  } else {
    return response.body;
  }
};

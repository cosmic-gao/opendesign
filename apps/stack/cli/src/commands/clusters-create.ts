import { CommandModule } from "yargs";
import { authenticatedClient } from "../lib/client";
import { getToken } from "../lib/auth";

interface ClusterCreateArgs {
  description?: string;
}

export const createCluster = async ({ description }: ClusterCreateArgs) => {
  const d = await authenticatedClient().createCluster({
    headers: {
      authorization: `Bearer ${getToken()}`,
    },
    body: {
      description: description ?? "CLI Created Cluster",
    },
  });

  if (d.status !== 204) {
    console.error(`Failed to create cluster: ${d.status}`);
    process.exit(1);
  } else {
    const clusters = await authenticatedClient().listClusters();

    if (clusters.status === 200) {
      const cluster = clusters.body.sort((a, b) =>
        a.createdAt > b.createdAt ? -1 : 1,
      )[0];

      return cluster;
    }
  }
};

export const ClusterCreate: CommandModule<{}, ClusterCreateArgs> = {
  command: "create",
  describe: "Create a new Inferable cluster",
  builder: (yargs) =>
    yargs.option("description", {
      describe: "Cluster Description",
      demandOption: false,
      type: "string",
    }),
  handler: async ({ description }) => {
    const cluster = await createCluster({ description });
    console.log("Cluster created successfully");
    console.log(cluster);
  },
};

import { CommandModule } from "yargs";
import { client } from "../lib/client";

interface ClusterCreateArgs {
  description?: string;
}
export const ClusterList: CommandModule<{}, ClusterCreateArgs> = {
  command: "list",
  aliases: ["ls"],
  describe: "List Inferable clusters",
  handler: async () => {
    const d = await client.listClusters();
    if (d.status !== 200) {
      console.error(`Failed to list clusters: ${d.status}`);
      return;
    }

    if (!d.body) {
      console.log("No clusters found");
      return;
    }

    console.log(
      d.body.map((c) => ({
        ...c,
        info: `inf clusters info --clusterId ${c.id}`,
      })),
    );
  },
};

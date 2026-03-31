import { CommandModule, showHelp } from "yargs";
import { ClusterCreate } from "./clusters-create";
import { ClusterList } from "./clusters-list";
import { ClusterInfo } from "./clusters-info";
import { ClusterTraces } from "./clusters-traces";

export const Clusters: CommandModule = {
  command: "clusters",
  aliases: ["cluster", "c"],
  describe: "Manage Inferable clusters",
  builder: (yargs) =>
    yargs
      .command(ClusterCreate)
      .command(ClusterList)
      .command(ClusterInfo)
      .command(ClusterTraces),
  handler: async () => {
    showHelp();
  },
};

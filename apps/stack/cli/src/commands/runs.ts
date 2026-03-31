import { CommandModule, showHelp } from "yargs";
import { RunList } from "./runs-list";
import { RunInfo } from "./runs-info";
import { RunCreate } from "./runs-create";
import { RunOpen } from "./open";

export const Runs: CommandModule = {
  command: "runs",
  aliases: ["run", "r"],
  describe: "Manage Runs",
  builder: (yargs) =>
    yargs.command(RunList).command(RunInfo).command(RunCreate).command(RunOpen),
  handler: () => {
    showHelp();
  },
};

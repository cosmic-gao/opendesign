import { CommandModule, showHelp } from "yargs";
import { CliUpdate } from "./cli-update";

export const Cli: CommandModule = {
  command: "cli",
  describe: "Manage Inferable cli",
  builder: (yargs) => yargs.command(CliUpdate),
  handler: async () => {
    showHelp();
  },
};

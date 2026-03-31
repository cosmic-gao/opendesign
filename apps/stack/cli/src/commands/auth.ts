import { CommandModule, showHelp } from "yargs";
import { ApiKeys } from "./auth-keys";
import { startTokenFlow } from "../lib/auth";

export const Auth: CommandModule = {
  command: "auth",
  describe: "Authenticate with the Inferable API.",
  builder: (yargs) =>
    yargs.command(ApiKeys).command({
      command: "login",
      describe: "Authenticate the Inferable CLI.",
      handler: async () => {
        await startTokenFlow();
      },
    }),
  handler: async () => {
    showHelp();
  },
};

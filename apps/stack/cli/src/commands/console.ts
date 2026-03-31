import { CommandModule } from "yargs";
import { readContext } from "../lib/context";

export const Console: CommandModule = {
  command: "console",
  describe: "Open ",
  builder: (yargs) =>
    yargs.option("show-secret", {
      describe: "Show the API secret",
      type: "boolean",
      default: false,
    }),
  handler: async ({ showSecret }) => {
    const context = readContext();

    console.log("CLI context:");

    const maskedSecret = context.apiSecret
      ? context.apiSecret?.slice(0, 6) + "..."
      : undefined;

    console.table({
      ...context,
      ...(showSecret
        ? { apiSecret: context.apiSecret }
        : { apiSecret: maskedSecret }),
    });
  },
};

import { CommandModule, showHelp } from "yargs";
import { GenerateOpenApi } from "./generate-open-api";
import { GenerateGraphql } from "./generate-graphql";

export const Generate: CommandModule = {
  command: "generate",
  describe: "Generate functions for GraphQL and OpenAPI",
  builder: (yargs) => yargs.command(GenerateOpenApi).command(GenerateGraphql),
  handler: async () => {
    showHelp();
  },
};

import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { askToLogin, selectCluster } from "../utils";
import { input } from "@inquirer/prompts";
import { displayRunInfo } from "./runs-info";

interface RunCreateArgs {
  cluster?: string;
  message?: string;
  attachedFunctions?: string[];
  resultSchema?: any;
}

export const RunCreate: CommandModule<{}, RunCreateArgs> = {
  command: "create [message]",
  describe: "Create a new run",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        alias: "c",
        type: "string",
        description: "Cluster ID",
      })
      .option("attachedFunctions", {
        type: "string",
        coerce: (type) => type.split(","),
        description:
          "A (comma separated) list of functions to attach to the run",
      })
      .option("resultSchema", {
        type: "string",
        coerce: (type) => JSON.parse(type),
        description: "Expected result schema for the run",
      })
      .positional("message", {
        type: "string",
        description: "Message / prompt to trigger the run",
      }),

  handler: async ({ cluster, message, attachedFunctions, resultSchema }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (!message) {
      message = await input({
        message: "Message to include in the run",
        required: true,
      });

      if (!message) {
        return;
      }
    }

    await createRun(cluster, message, attachedFunctions, resultSchema);
  },
};

const createRun = async (
  cluster: string,
  message: string,
  attachedFunctions?: string[],
  resultSchema?: any,
) => {
  const d = await client.createRun({
    params: {
      clusterId: cluster,
    },
    body: {
      initialPrompt: message,
      attachedFunctions: attachedFunctions?.map((f) => {
        const [service, functionName] = f.split("_");
        return {
          service,
          function: functionName,
        };
      }),
      resultSchema,
    },
  });

  if (d.status === 401) {
    askToLogin();
    process.exit(1);
  }

  if (d.status !== 201) {
    console.error(`Failed to create run`, {
      status: d.status,
    });
    console.error(JSON.stringify(d.body, null, 2));

    return;
  }

  await displayRunInfo(cluster, d.body.id);
};

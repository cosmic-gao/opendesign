import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";
import chalk from "chalk";

interface ClusterInfoArgs {
  clusterId?: string;
  json?: boolean;
}

export const ClusterInfo: CommandModule<{}, ClusterInfoArgs> = {
  command: "info",
  describe: "Display information about a Inferable cluster",
  builder: (yargs) =>
    yargs
      .option("clusterId", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("json", {
        describe: "Output in JSON format",
        type: "boolean",
        default: false,
      }),
  handler: async ({ clusterId, json }) => {
    if (!clusterId) {
      clusterId = await selectCluster();
      if (!clusterId) {
        console.log("No cluster selected");
        return;
      }
    }

    if (json) {
      await getClusterDetailsJson(clusterId);
    } else {
      await getClusterDetails(clusterId);
    }
  },
};

const getClusterDetailsJson = async (clusterId: string) => {
  const d = await client.getCluster({
    params: {
      clusterId,
    },
  });
  if (d.status !== 200) {
    console.error(`Failed to get cluster details: ${d.status}`);
    return;
  }
  console.log(JSON.stringify(d.body, null, 2));
};

const getClusterDetails = async (clusterId: string) => {
  while (true) {
    const d = await client.getCluster({
      params: {
        clusterId,
      },
    });
    console.clear(); // Clear the console before each update
    if (d.status !== 200) {
      console.error(`Failed to get cluster details: ${d.status}`);
      return;
    }

    // Main cluster information
    console.log(chalk.bgCyan.black.bold("\nCluster Information:"));
    console.log(`${chalk.cyan("ID:")}            \t${d.body.id}`);
    console.log(`${chalk.cyan("Name:")}          \t${d.body.name}`);
    if (d.body.description) {
      console.log(`${chalk.cyan("Description:")}`);
      console.log(chalk.gray(`\t${d.body.description}`));
    }
    console.log(
      `${chalk.cyan("Created At:")}    \t${new Date(d.body.createdAt).toLocaleString()}`,
    );

    // Machines information
    const machines = await client.listMachines({ params: { clusterId } });
    if (machines.status === 200 && machines.body.length > 0) {
      console.log(chalk.bgCyan.black.bold("\nMachines:"));
      machines.body.forEach((m) => {
        console.log(chalk.cyan.bold(`\nMachine: ${m.id}`));
        console.log(
          `${chalk.cyan("Last Ping:")}   \t${m.lastPingAt ? new Date(m.lastPingAt).toLocaleString() : "unknown"}`,
        );
        console.log(`${chalk.cyan("IP:")}           \t${m.ip}`);
      });
    }

    // Services information
    const services = await client.listServices({ params: { clusterId } });
    if (services.status === 200 && services.body.length > 0) {
      console.log(chalk.bgCyan.black.bold("\nServices:"));
      services.body.forEach((def) => {
        console.log(chalk.cyan.bold(`\nService: ${def.name}`));
        if (def.description) {
          console.log(chalk.gray(`${def.description}`));
        }
        if (def.functions && def.functions.length > 0) {
          console.log(`${chalk.cyan("Functions:")}`);
          def.functions.forEach((f) => {
            console.log(`  - ${f.name}:`);
            if (f.description) {
              console.log(chalk.gray(`    ${f.description}`));
            }
          });
        }
      });
    }

    console.log(chalk.yellow("\nPress Ctrl+c to quit..."));

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

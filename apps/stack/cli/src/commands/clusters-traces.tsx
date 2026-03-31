import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";
import chalk from "chalk";
import readline from "readline";
import Table from "cli-table3";
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";

interface ClusterTracesArgs {
  cluster?: string;
  json?: boolean;
}

export const ClusterTraces: CommandModule<{}, ClusterTracesArgs> = {
  command: "traces",
  describe: "Display traces for an Inferable cluster",
  builder: (yargs) =>
    yargs
      .option("cluster", {
        describe: "Cluster ID",
        demandOption: false,
        type: "string",
      })
      .option("json", {
        describe: "Output in JSON format",
        type: "boolean",
        default: false,
      }),
  handler: async ({ cluster, json }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (json) {
      await getClusterTracesJson(cluster);
    } else {
      await getClusterTraces(cluster);
    }
  },
};

interface Trace {
  createdAt: string;
  type: string;
  machineId: string | null;
  service: string | null;
  jobId: string | null;
  targetFn: string | null;
  resultType: string | null;
  status: string | null;
  workflowId: string | null;
}

const ClusterTracesApp = ({ clusterId }: { clusterId: string }) => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const { exit } = useApp();

  useEffect(() => {
    const fetchTraces = async () => {
      const response = await client.listEvents({
        params: { clusterId },
      });

      if (response.status === 200) {
        setTraces(response.body);
      } else {
        console.error(`Failed to get cluster traces: ${response.status}`);
        exit();
      }
    };

    fetchTraces();
    const interval = setInterval(fetchTraces, 2000);

    return () => clearInterval(interval);
  }, [clusterId, exit]);

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <Box marginBottom={1}>
        <Text backgroundColor="cyan" color="black" bold>
          Cluster Traces:
        </Text>
      </Box>
      {traces.map((trace, index) => (
        <Box key={index} flexDirection="column" marginBottom={1}>
          <Text bold>
            {new Date(trace.createdAt).toLocaleString()} - {trace.type || "N/A"}
          </Text>
          <Text dimColor>
            {`machineId=${trace.machineId || "N/A"}, `}
            {`service=${trace.service || "N/A"}, `}
            {`jobId=${trace.jobId || "N/A"}, `}
            {`targetFn=${trace.targetFn || "N/A"}, `}
            {`resultType=${trace.resultType || "N/A"}, `}
            {`status=${trace.status || "N/A"}, `}
            {`workflowId=${trace.workflowId || "N/A"}`}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="yellow"> Press 'q' to quit...</Text>
      </Box>
    </Box>
  );
};

const getClusterTracesJson = async (clusterId: string) => {
  const traces = await client.listEvents({
    params: { clusterId },
  });

  if (traces.status !== 200) {
    console.error(`Failed to get cluster traces: ${traces.status}`);
    return;
  }

  console.log(JSON.stringify(traces.body, null, 2));
};

const getClusterTraces = async (clusterId: string) => {
  render(<ClusterTracesApp clusterId={clusterId} />);
};

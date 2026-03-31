import { CommandModule } from "yargs";
import { client } from "../lib/client";
import { selectCluster } from "../utils";
import chalk from "chalk";

interface ClusterTracesArgs {
  cluster?: string;
  json?: boolean;
  limit?: number;
  workflowId?: string;
  jobId?: string;
  service?: string;
  includeMeta?: boolean;
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
      })
      .option("limit", {
        describe: "Limit the number of traces to display",
        type: "number",
        default: 20,
      })
      .option("workflow-id", {
        describe: "Filter traces by workflow ID",
        type: "string",
      })
      .option("job-id", {
        describe: "Filter traces by job ID",
        type: "string",
      })
      .option("service", {
        describe: "Filter traces by service",
        type: "string",
      })
      .option("include-meta", {
        describe: "Include metadata in the output",
        type: "boolean",
        default: false,
      }),
  handler: async ({
    cluster,
    json,
    limit,
    workflowId,
    jobId,
    service,
    includeMeta,
  }) => {
    if (!cluster) {
      cluster = await selectCluster();
      if (!cluster) {
        console.log("No cluster selected");
        return;
      }
    }

    if (json) {
      await getClusterTracesJson(
        cluster,
        limit ?? 20,
        workflowId,
        jobId,
        service,
        includeMeta,
      );
    } else {
      await getClusterTraces(
        cluster,
        limit ?? 20,
        workflowId,
        jobId,
        service,
        includeMeta,
      );
    }
  },
};

interface Trace {
  createdAt: string;
  type: string;
  machineId: string;
  service: string;
  jobId: string;
  targetFn: string;
  resultType: string;
  status: string;
  workflowId: string;
  meta?: Record<string, any>;
}

const getClusterTracesJson = async (
  clusterId: string,
  limit: number,
  workflowId?: string,
  jobId?: string,
  service?: string,
  includeMeta?: boolean,
) => {
  const traces = await client.listEvents({
    params: { clusterId },
    query: {
      workflowId,
      jobId,
      service,
      includeMeta: includeMeta ? "true" : "false",
    },
  });

  if (traces.status !== 200) {
    console.error(`Failed to get cluster traces: ${traces.status}`);
    return;
  }

  console.log(
    JSON.stringify(
      traces.body
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, limit),
      null,
      2,
    ),
  );
};

const getClusterTraces = async (
  clusterId: string,
  limit: number,
  workflowId?: string,
  jobId?: string,
  service?: string,
  includeMeta?: boolean,
) => {
  let isRunning = true;

  let lastMaxTraceId: string | null = null;

  const fetchAndDisplayTraces = async () => {
    const response = await client.listEvents({
      params: { clusterId },
      query: {
        workflowId,
        jobId,
        service,
        includeMeta: includeMeta ? "true" : "false",
      },
    });

    if (response.status !== 200) {
      console.error(`Failed to get cluster traces: ${response.status}`);
      isRunning = false;
      return;
    }

    const traces = response.body
      .sort((a, b) => a.id.localeCompare(b.id))
      .filter((trace) => trace.id > (lastMaxTraceId || ""));

    traces.forEach((trace) => {
      console.log(
        chalk.bold(
          `${new Date(trace.createdAt).toLocaleString()} - ${trace.type || "N/A"}`,
        ),
      );

      const traceInfo = [
        { key: "machineId", value: trace.machineId },
        { key: "service", value: trace.service },
        { key: "jobId", value: trace.jobId },
        { key: "targetFn", value: trace.targetFn },
        { key: "resultType", value: trace.resultType },
        { key: "status", value: trace.status },
        { key: "workflowId", value: trace.workflowId },
      ]
        .filter((item) => item.value)
        .map((item) => `${item.key}=${chalk.bold(item.value)}`)
        .join(", ");

      console.log(chalk.dim(traceInfo));
      if (includeMeta) {
        console.log(chalk.dim(JSON.stringify({ meta: trace.meta }, null, 2)));
      }
      console.log();
    });

    lastMaxTraceId = traces[traces.length - 1]?.id || lastMaxTraceId;
  };

  // Initial fetch and display
  await fetchAndDisplayTraces();

  setInterval(fetchAndDisplayTraces, 2000);

  // Keep the process running
  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

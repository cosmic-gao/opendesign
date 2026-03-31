import { client } from "./lib/client";
import { select, input } from "@inquirer/prompts";
import { readContext } from "./lib/context";
import chalk from "chalk";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import unzipper from "unzipper";
import { createWriteStream, existsSync } from "fs";
import { appendFile, cp, mkdir, rm } from "fs/promises";

export const askToLogin = () => {
  console.log(
    chalk.red("You are not logged in. Please run:") +
      "\n" +
      chalk.cyan("$ inf auth login"),
  );
};

export const selectCluster = async (): Promise<string | undefined> => {
  const context = readContext();
  if (context.clusterId) {
    console.log(`Using cluster ${context.clusterId} from context`);
    return context.clusterId;
  }

  const d = await client.listClusters();

  if (d.status === 401) {
    askToLogin();
    process.exit(1);
  }

  if (d.status !== 200) {
    console.error(`Failed to get clusters: ${d.status}.`);
    return;
  }

  if (!d.body || !d.body.length) {
    console.log("No clusters found");
    return;
  }

  if (d.body.length === 1) {
    console.log(`Using cluster ${d.body[0].id}`);
    return d.body[0].id;
  }

  return select({
    message: "Select a cluster",
    choices: d.body.map((c: any) => ({
      name: `${c.name} (${c.id})`,
      value: c.id,
    })),
  });
};

export const selectRun = async (
  clusterId: string,
): Promise<string | undefined> => {
  const d = await client.listRuns({
    params: {
      clusterId,
    },
  });

  if (d.status === 401) {
    askToLogin();
    process.exit(1);
  }

  if (d.status !== 200) {
    console.error(`Failed to get runs: ${d.status}.`);
    return;
  }

  if (!d.body || !d.body.length) {
    console.log("No runs found");
    return;
  }

  if (d.body.length === 1) {
    console.log(`Using run ${d.body[0].id}`);
    return d.body[0].id;
  }

  return select({
    message: "Select a run",
    choices: d.body.map((w: any) => ({
      name: `${w.name} (${w.id})`,
      value: w.id,
    })),
  });
};

export const downloadProject = async (
  url: string,
  refName: string,
  outDir: string,
): Promise<void> => {
  const tmpDir = `${os.tmpdir()}/${Math.random().toString(36).substring(2, 15)}`;

  await mkdir(tmpDir);

  const response = await fetch(url);

  if (response.body === null) {
    throw new Error(`Error when downloading project. Response body is null`);
  }

  const destination = path.resolve(tmpDir, "proxy.zip");

  const stream = createWriteStream(destination, { flags: "wx" });

  await finished(Readable.fromWeb(response.body as any).pipe(stream));

  const directory = await unzipper.Open.file(destination);

  await directory.extract({ path: tmpDir });

  if (existsSync(outDir)) {
    console.log(
      `🚨 Directory ${outDir} already exists. If you want to continue, delete the directory and run the command again.`,
    );
    process.exit(1);
  }

  console.log(path.resolve(tmpDir, refName));

  await cp(path.resolve(tmpDir, refName), outDir, { recursive: true });

  // await rm(tmpDir, { recursive: true });
};

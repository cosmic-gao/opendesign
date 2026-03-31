import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { DEFAULT_CLI_CONTEXT } from "../constants";

export type CliContext = {
  apiUrl: string;
  appUrl: string;
  clusterId?: string;
};

function omitUndefined(
  obj: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined),
  ) as Record<string, string>;
}

// Loads the context from process.env and .env file in the current working directory
export const readContext = (): CliContext => {
  let envConfig: dotenv.DotenvParseOutput = {};

  // First, check process.env
  const processEnv = omitUndefined({
    INFERABLE_API_ENDPOINT: process.env.INFERABLE_API_ENDPOINT,
    INFERABLE_CLUSTER_ID: process.env.INFERABLE_CLUSTER_ID,
  });

  // Then, read from .env file if it exists
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
  }

  // Merge process.env and .env, with process.env taking precedence
  const mergedEnv = { ...envConfig, ...processEnv };

  return {
    apiUrl: mergedEnv.INFERABLE_API_ENDPOINT || DEFAULT_CLI_CONTEXT.apiUrl,
    appUrl: mergedEnv.INFERABLE_APP_ENDPOINT || DEFAULT_CLI_CONTEXT.appUrl,
    clusterId: mergedEnv.INFERABLE_CLUSTER_ID,
  };
};

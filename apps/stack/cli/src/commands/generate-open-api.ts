import { CommandModule } from "yargs";
import SwaggerParser from "@apidevtools/swagger-parser";
import fs from "fs";
import os from "os";
import { mkdir } from "fs/promises";

import { jsonSchemaToZod } from "json-schema-to-zod";
import { fromOpenAPI } from "../lib/openapi";

import * as Handlebars from "handlebars";

import * as path from "path";

interface GenerateOpenApiArgs {
  schema: string;
  name: string;
  dir?: string;
  operationId?: string;
}

export const GenerateOpenApi: CommandModule<{}, GenerateOpenApiArgs> = {
  command: "openapi [schema] [name] [dir] [operationId]",
  describe: "Generates an Inferable Service from an OpenAPI schema",
  builder: (yargs) =>
    yargs
      .option("schema", {
        alias: "s",
        describe: "OpenAPI schema file (JSON, YAML) or URL",
        type: "string",
        demandOption: true,
      })
      .option("name", {
        alias: "n",
        describe: "Name of the service",
        type: "string",
        demandOption: true,
      })
      .option("dir", {
        alias: "d",
        describe: "Directory to create service in",
        type: "string",
        demandOption: false,
      })
      .option("operationId", {
        alias: "o",
        describe: "Operation ID",
        type: "string",
        demandOption: false,
      }),
  handler: async ({ schema, name, dir, operationId }) => {
    const tmpDir = `${os.tmpdir()}/${Math.random().toString(36).substring(2, 15)}`;

    await mkdir(tmpDir);
    const distPath = `${tmpDir}`;

    if (name.match(/[^A-Za-z0-9]/)) {
      console.error("Service name can only contain letters and numbers");
      process.exit(1);
    }

    if (!dir) {
      // Check if ./src/services dir exists
      const proxyServiceDir = "./src/services";
      if (fs.existsSync(proxyServiceDir)) {
        console.log("Detected Proxy project structure");
        dir = proxyServiceDir;
      } else {
        console.log("No directory specified, using current directory");
        dir = "./";
      }
    }

    const bundle = await SwaggerParser.bundle(schema);
    const apiDoc = await SwaggerParser.dereference(bundle);

    if (!apiDoc?.paths) {
      console.error("Invalid OpenAPI schema");
      process.exit(1);
    }

    const serviceFileName = `${name}.service.ts`;
    const tmpServiceFile = path.join(distPath, serviceFileName);

    fs.mkdirSync(path.join(dir, name), { recursive: true });
    fs.mkdirSync(path.join(dir, name, "functions"), { recursive: true });

    generateServiceFile(name, tmpServiceFile);
    fs.renameSync(tmpServiceFile, path.join(dir, name, serviceFileName));

    if (fs.existsSync(path.join(dir, name, `${name}.config.ts`))) {
      console.log(
        `Config file already exists: ${name}.config.ts. Skipping config generation...`,
      );
    } else {
      generateConfigFile(name, path.join(dir, name, `${name}.config.ts`));
    }

    console.log(`✅ Service file generated: ${serviceFileName}`);

    const functions = await fromOpenAPI({
      schema: apiDoc,
      operationId,
    });

    const serviceFunctions = operationId
      ? functions.filter((f) => f.operationId === operationId)
      : functions;

    if (serviceFunctions.length === 0) {
      console.error(`No functions to generate (operationId=${operationId})`);
      process.exit(1);
    }

    serviceFunctions.forEach((f) => {
      const functionfileName = `${name}.${f.operationId}.ts`;
      const tmpFnFile = path.join(distPath, functionfileName);

      generateFunctionFile(f, name, tmpFnFile);

      // TODO: Check for existing files and warn
      fs.renameSync(
        tmpFnFile,
        path.join(dir, name, "functions", functionfileName),
      );

      console.log(`✅ Function file generated: ${functionfileName}`);
    });
  },
};

const generateConfigFile = (name: string, outPath: string) => {
  const configTemplate = `if (!process.env.INFERABLE_SERVICE_${name.toUpperCase()}_URL) {
  throw new Error("Missing environment variable: INFERABLE_SERVICE_${name.toUpperCase()}_URL");
}
  
const config = {
  axiosDefaults() {
    return {
      baseURL: process.env.INFERABLE_SERVICE_${name.toUpperCase()}_URL,
      headers: {
        "Content-Type": "application/json",
      },
    };
  },
};

export default config;
`;

  fs.writeFileSync(outPath, configTemplate, "utf8");
};

const generateServiceFile = (name: string, outPath: string) => {
  const serviceTemplate = `import fs from "fs";
import path from "path";

const functions = fs
  .readdirSync(path.join(__dirname, "functions"))
  .filter((f) => {
    const [service, operationId, ext, ...rest] = f.split(".");
    const isService = service === "{{serviceName}}" && (ext === "ts" || ext === "js") && operationId && !rest.length;

    if (!isService) {
      console.debug("Skipping function file", f);
    }

    return isService;
  })
  .map((f) => require(\`./functions/\${f}\`).default)
  .filter(Boolean);

if (functions.length === 0) {
  throw new Error("No valid functions found for service {{serviceName}}");
}

export default {
  name: "{{serviceName}}",
  functions,
};
`;

  const compiledTemplate = Handlebars.compile(serviceTemplate);

  const generatedServiceFile = compiledTemplate({
    serviceName: name,
  });

  fs.writeFileSync(outPath, generatedServiceFile, "utf8");
};

const generateFunctionFile = (
  fn: any,
  serviceName: string,
  outPath: string,
) => {
  const functionTemplate = `import axios from 'axios';
import z from 'zod';
import config from '../{{serviceName}}.config';

const inputSchema = {{zodSchema}}

const inputMap = {{inputMap}}

const method = "{{method}}"

export default {
  name: "{{name}}",
  func: async (input: Zod.infer<typeof inputSchema>) => {
    const iterable = input as any;

    const params = inputMap["query"].reduce((p, k) => ({ ...p, [k]: iterable[k] }), {});
    const headers = inputMap["headers"].reduce((p, k) => ({ ...p, [k]: iterable[k] }), {});
    const body = inputMap["body"].reduce((p, k) => ({ ...p, [k]: iterable[k] }), {});
    const compiledUrl = inputMap["path"].reduce((p, k) => p.replace("{" + k + "}", iterable[k]), "{{url}}");

    const result = await axios({
      ...config.axiosDefaults(),
      url: compiledUrl,
      method,
      params,
      data: body,
      headers: {
        ...config.axiosDefaults().headers,
        ...headers,
      },
    });

    return result.data
  },
  description: "{{description}}",
  schema: {
    input: inputSchema
  }
}
`;
  const zodSchema = jsonSchemaToZod(fn.schema.input as any, { noImport: true });

  const compiledTemplate = Handlebars.compile(functionTemplate, {
    noEscape: true,
  });

  const url = fn.endpoint;

  const generatedFunctionFile = compiledTemplate({
    ...fn,
    inputMap: JSON.stringify(fn.inputMap),
    serviceName,
    url,
    zodSchema,
    name: fn.operationId,
  });

  fs.writeFileSync(outPath, generatedFunctionFile, "utf8");
};

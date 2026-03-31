import { CommandModule } from "yargs";
import fs from "fs";
import os from "os";
import { mkdir } from "fs/promises";
import * as Handlebars from "handlebars";

import { jsonSchemaToZod } from "json-schema-to-zod";

import { input } from "@inquirer/prompts";

import * as path from "path";
import { fromGraphQL } from "./../lib/graphql";

interface GenerateGraphqlArgs {
  schema?: string;
  operations?: string;
  name?: string;
  dir?: string;
}

export const GenerateGraphql: CommandModule<{}, GenerateGraphqlArgs> = {
  command: "graphql [name] [schema] [operations] [dir]",
  describe: "Generates an Inferable Service from a GraphQL schema",
  builder: (yargs) =>
    yargs
      .positional("name", {
        describe: "Name of the service",
        type: "string",
      })
      .positional("schema", {
        describe: "GraphQL schema file",
        type: "string",
      })
      .positional("operations", {
        describe: "GraphQL operations file",
        type: "string",
      })
      .positional("dir", {
        describe: "Directory to create service in",
        type: "string",
      }),
  handler: async ({ schema, operations, name, dir }) => {
    const tmpDir = `${os.tmpdir()}/${Math.random().toString(36).substring(2, 15)}`;

    await mkdir(tmpDir);
    const distPath = `${tmpDir}`;

    if (!name) {
      name = await input({
        message: "Inferable service name",
        validate: (value) => {
          if (!value) {
            return "Service name is required";
          }
          return true;
        },
      });
    }

    if (name.match(/[^A-Za-z0-9]/)) {
      console.error("Service name can only contain letters and numbers");
      process.exit(1);
    }

    if (!schema) {
      schema = await input({
        message: "GraphQL schema file",
        validate: (value) => {
          if (!value) {
            return "GraphQL schema is required";
          }
          return true;
        },
      });
    }

    if (!operations) {
      operations = await input({
        message: "GraphQL operations file",
        validate: (value) => {
          if (!value) {
            return "GraphQL operations are required";
          }
          return true;
        },
      });
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

    const functions = await fromGraphQL({
      schema,
      operations,
    });

    functions.forEach((f) => {
      const functionfileName = `${name}.${f.name}.ts`;
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
    const [service, name, ext, ...rest] = f.split(".");
    const isService = service === "{{serviceName}}" && (ext === "ts" || ext === "js") && name && !rest.length;

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
  const isMutation = fn.query.trim().startsWith("mutation");

  const functionTemplate = `import axios from 'axios';
import z from 'zod';
import config from '../{{serviceName}}.config';

const inputSchema = {{zodSchema}}

const query = \`
{{query}}
\`

export default {
  name: "{{name}}",
  description: "{{description}}",
  func: async (input: Zod.infer<typeof inputSchema>) => {

   const result = await axios({
      ...config.axiosDefaults(),
     method: "POST",
     data: {
       query,
       variables: input
     },
    });

    return result.data
  },
  schema: {
    input: inputSchema
  },
  config: {
    requiresApproval: {{requiresApproval}}
  }
}
 `;
  const zodSchema = jsonSchemaToZod(fn.schema.input as any, { noImport: true });

  const compiledTemplate = Handlebars.compile(functionTemplate, {
    noEscape: true,
  });

  const generatedFunctionFile = compiledTemplate({
    ...fn,
    description: fn.description || `Function for the ${fn.name} operation`,
    serviceName,
    zodSchema,
    requiresApproval: isMutation ? "true" : "false",
  });

  fs.writeFileSync(outPath, generatedFunctionFile, "utf8");
};

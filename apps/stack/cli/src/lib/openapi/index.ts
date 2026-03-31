import SwaggerParser from "@apidevtools/swagger-parser";
import { openapiSchemaToJsonSchema as toJsonSchema } from "@openapi-contrib/openapi-schema-to-json-schema";
import { OpenAPI } from "openapi-types";

type Output = {
  operationId: string;
  endpoint: string;
  method: string;
  description: string;
  schema: any;
  inputMap: any;
};

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
] as const;

export const fromOpenAPI = async ({
  schema,
  operationId,
}: {
  schema: OpenAPI.Document;
  operationId?: string;
}): Promise<Output[]> => {
  const bundle = await SwaggerParser.bundle(schema);
  schema = await SwaggerParser.dereference(bundle);

  if (!schema?.paths) {
    return [];
  }

  const paths = Object.keys(schema?.paths);

  // Build the service function definitions for each endpoint / method combination
  return paths.reduce((acc, path) => {
    const pathObj = schema.paths?.[path];

    if (!pathObj) return acc;

    // Find all the endpoints for the path and map to Service Functions
    HTTP_METHODS.forEach((method) => {
      if (pathObj[method]) {
        if (operationId && pathObj[method]?.operationId !== operationId) {
          return;
        }

        let registration = buildServiceFunction({
          pathObj,
          method,
          path,
        });

        if (registration) {
          acc.push(registration);
        }
      }
    });

    return acc;
  }, [] as Output[]);
};

const buildServiceFunction = ({
  pathObj,
  method,
  path,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathObj: any;
  method: (typeof HTTP_METHODS)[number];
  path: string;
}): Output => {
  const bodyArgs = toJsonSchema(
    pathObj[method]["requestBody"]?.["content"]?.["application/json"]?.[
      "schema"
    ] ?? {},
  );

  // inherit the pathObj parameters into the method schema
  // For example:
  //
  // "/api/v2/users/{user_id}": {
  //     "parameters": [ <-- these parameters are inherited by all methods
  //       {
  //         "$ref": "#/components/parameters/UserId"
  //       }
  //     ],
  //     "get": {
  //       "operationId": "ShowUser",
  //
  pathObj[method].parameters = (pathObj[method].parameters ?? []).concat(
    pathObj.parameters ?? [],
  );

  const inputSchema = {
    type: "object",
    properties: bodyArgs.properties ?? {},
    required: [] as string[],
  };

  // Build the required list from body args
  if (bodyArgs.required && !(bodyArgs.required instanceof Boolean)) {
    const required = bodyArgs.required as string[];
    required.forEach((prop: string) => {
      inputSchema.required.push(prop);
    });
  }

  // Append parameter args to the input schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathObj[method].parameters?.forEach((param: any) => {
    inputSchema.properties[param.name] = {
      type: param.schema.type,
      description: param.description,
    };
    if (param?.required) inputSchema.required.push(param.name);
  });

  const inputMap = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query:
      pathObj[method].parameters
        ?.filter((param: any) => param.in === "query")
        .map((param: any) => param.name) ?? [],
    headers:
      pathObj[method].parameters
        ?.filter((param: any) => param.in === "header")
        .map((param: any) => param.name) ?? [],
    body: bodyArgs.properties ? Object.keys(bodyArgs.properties) : [],
    path:
      pathObj[method].parameters
        ?.filter((param: any) => param.in === "path")
        .map((param: any) => param.name) ?? [],
  };

  const operationId = pathObj[method].operationId;

  if (!operationId) {
    throw new Error(`operationId is required for ${path} ${method}`);
  }

  return {
    operationId: pathObj[method].operationId,
    description: pathObj[method].summary || pathObj[method].description,
    endpoint: path,
    method: method,
    schema: {
      input: inputSchema,
    },
    inputMap,
  };
};

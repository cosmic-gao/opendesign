import { readFileSync } from "fs";
import { DocumentNode, parse, print } from "graphql";
import { loadDocumentsSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { toJsonSchema as toJsonSchema } from "./toJsonSchema";

type SchemaInput = string | DocumentNode;
type OperationsInput = string | DocumentNode[];

type Output = {
  name: string;
  query: string;
  endpoint: string;
  description: string;
  schema: any;
};

export const fromGraphQL = async ({
  schema,
  operations,
}: {
  schema: SchemaInput;
  operations?: OperationsInput;
}): Promise<Output[]> => {
  const baseSchema = getBaseSchema(schema);

  const functions: Output[] = [];

  if (operations) {
    const operationDocuments = getOperationDocuments(operations);

    operationDocuments.forEach((document) => {
      Object.entries(
        toJsonSchema({
          document,
          include: baseSchema,
        }),
      )
        .map(([name, schema]) => {
          const definition = document?.definitions.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (def: any) => def.name?.value === name,
          );

          if (!definition) {
            throw new Error(`Missing definition for ${name}`);
          }

          return {
            name,
            query: print(definition),
            schema: {
              input: schema,
            },
          } as Output;
        })
        .filter(Boolean)
        .forEach((fn) => {
          if (fn) {
            functions.push(fn);
          }
        });
    });
  }

  return functions;
};

const getBaseSchema = (schema: SchemaInput): DocumentNode => {
  if (typeof schema === "string") {
    return parse(readFileSync(schema, "utf8"));
  }
  return schema;
};

const getOperationDocuments = (operations: OperationsInput) => {
  if (typeof operations === "string") {
    return loadDocumentsSync(operations, {
      loaders: [new GraphQLFileLoader()],
    })
      .map((doc) => {
        return doc.document;
      })
      .filter(Boolean) as DocumentNode[];
  }
  return operations;
};

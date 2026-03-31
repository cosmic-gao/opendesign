import { fromOpenAPI } from "./index";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const axiosMock = new MockAdapter(axios);

const testSpec = {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Sample API",
  },
  components: {
    parameters: {
      id: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
      filter: {
        name: "filter",
        in: "query",
        schema: {
          type: "string",
        },
      },
      authorization: {
        name: "authorization",
        in: "header",
        required: true,
        schema: {
          type: "string",
        },
      },
    },
    responses: {
      SuccessfulResponse: {
        description: "Successful Response",
      },
    },
  },
  paths: {
    "/list/{id}": {
      get: {
        description: "Returns a list of stuff",
        summary: "List stuff",
        operationId: "getStuffById",
        parameters: [
          {
            $ref: "#/components/parameters/id",
          },
          {
            $ref: "#/components/parameters/filter",
          },
          {
            $ref: "#/components/parameters/authorization",
          },
        ],
        responses: {
          "200": {
            $ref: "#/components/responses/SuccessfulResponse",
          },
        },
      },
      post: {
        description: "Creates a list of stuff",
        operationId: "postListId",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "authorization",
            in: "header",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: {
                    type: "string",
                  },
                  details: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                      },
                      tags: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Successful Response",
          },
        },
      },
    },
  },
};

describe("fromOpenAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should register HTTP endpoints as functions", async () => {
    const result = await fromOpenAPI({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: testSpec as any,
      baseUrl: "http://localhost",
    });

    expect(result.length).toBe(2);
    expect(result[0].operationId).toBe("getStuffById");
    expect(result[0].description).toBe("List stuff");
    expect(result[0].schema.input).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        filter: { type: "string" },
        authorization: { type: "string" },
      },
      required: ["id", "authorization"],
    });
    expect(() => ajv.compile(result[0].schema.input)).not.toThrow();

    expect(result[1].operationId).toBe("postListId");
    expect(result[1].schema.input).toMatchObject({
      type: "object",
      properties: {
        id: { type: "string" },
        authorization: { type: "string" },
        name: { type: "string" },
        details: {
          type: "object",
          properties: {
            description: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["name", "id", "authorization"],
    });
    expect(() => ajv.compile(result[1].schema.input)).not.toThrow();
  });
});

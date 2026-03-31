import { fromGraphQL } from "./";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

const axiosMock = new MockAdapter(axios);

describe("fromGraphQL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.reset();
  });

  describe("Function Registration", () => {
    const mockSchema: DocumentNode = gql`
      type Query {
        getComplexType(
          """
          Some details about the ID
          """
          id: ID!
        ): ComplexType
        getComplextTypeByEnumField(enums: [SampleEnum!]): ComplexType
      }

      type Mutation {
        createUser(input: CreateUserInput!): User
      }

      input CreateUserInput {
        """
        The user's name
        """
        name: String!
        """
        The user's email address
        """
        email: String!
        enumField: SampleEnum
        """
        Enum description override
        """
        enumFieldWithDescription: SampleEnum
      }

      type User {
        id: ID!
        name: String!
        email: String
      }

      type ComplexType {
        id: ID!
        string: String
        integer: Int
        float: Float
        boolean: Boolean
        stringArray: [String]
        nestedObject: NestedObject
        enumField: SampleEnum
      }

      type NestedObject {
        field1: String
        field2: Int
      }

      """
      Sample enum description
      """
      enum SampleEnum {
        OPTION_A
        OPTION_B
        OPTION_C
      }

      enum SampleEnumWithNoDescription {
        OPTION_A
        OPTION_B
        OPTION_C
      }
    `;

    it("should register GraphQL queries as functions", async () => {
      const mockOperations: DocumentNode[] = [
        gql`
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              name
              email
            }
          }
        `,
      ];

      const result = await fromGraphQL({
        schema: mockSchema,
        operations: mockOperations,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "GetUser",
        schema: {
          input: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
        },
      });

      expect(() => ajv.compile(result[0].schema.input)).not.toThrow();
    });

    it("should register GraphQL mutations as functions", async () => {
      const mockOperations: DocumentNode[] = [
        gql`
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
              email
            }
          }
        `,
      ];

      const result = await fromGraphQL({
        schema: mockSchema,
        operations: mockOperations,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "CreateUser",
        schema: {
          input: {
            type: "object",
            properties: {
              input: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The user's name" },
                  email: {
                    type: "string",
                    description: "The user's email address",
                  },
                  enumField: {
                    type: "string",
                    description: "Sample enum description",
                  },
                  enumFieldWithDescription: {
                    type: "string",
                    description: "Enum description override",
                  },
                },
                required: ["name", "email"],
              },
            },
            required: ["input"],
          },
        },
      });
      expect(() => ajv.compile(result[0].schema.input)).not.toThrow();
    });

    it("should correctly map GraphQL types to JSON Schema", async () => {
      const mockOperations: DocumentNode[] = [
        gql`
          query GetComplexType($id: ID!) {
            getComplexType(id: $id) {
              id
              string
              integer
              float
              boolean
              stringArray
              nestedObject {
                field1
                field2
              }
              enumField
            }
          }
        `,
      ];

      const result = await fromGraphQL({
        schema: mockSchema,
        operations: mockOperations,
      });

      expect(result).toHaveLength(1);
      expect(result[0].schema.input).toMatchObject({
        type: "object",
        properties: {
          id: {
            description: "Some details about the ID",
            type: "string",
          },
        },
        required: ["id"],
      });

      expect(result[0].name).toBe("GetComplexType");
      expect(() => ajv.compile(result[0].schema.input)).not.toThrow();
    });

    it("should accept array of enum inputs", async () => {
      const mockOperations: DocumentNode[] = [
        gql`
          query GetComplextTypeByEnumField($enums: [SampleEnum!]!) {
            getComplextTypeByEnumField(enums: $enums) {
              id
              enumField
            }
          }
        `,
      ];

      const result = await fromGraphQL({
        schema: mockSchema,
        operations: mockOperations,
      });

      expect(result).toHaveLength(1);
      expect(result[0].schema.input).toMatchObject({
        type: "object",
        properties: {
          enums: {
            type: "array",
            items: {
              type: "string",
              enum: ["OPTION_A", "OPTION_B", "OPTION_C"],
            },
          },
        },
        required: ["enums"],
      });
      expect(() => ajv.compile(result[0].schema.input)).not.toThrow();
    });

    it("should handle types with no description", async () => {
      const mockOperations: DocumentNode[] = [
        gql`
          query GetComplextTypeByEnumField(
            $enums: [SampleEnumWithNoDescription!]!
          ) {
            getComplextTypeByEnumField(enums: $enums) {
              id
              enumField
            }
          }
        `,
      ];

      const result = await fromGraphQL({
        schema: mockSchema,
        operations: mockOperations,
      });

      expect(result).toHaveLength(1);
      expect(result[0].schema.input).toMatchObject({
        type: "object",
        properties: {
          enums: {
            type: "array",
            items: {
              type: "string",
              enum: ["OPTION_A", "OPTION_B", "OPTION_C"],
            },
          },
        },
        required: ["enums"],
      });
      expect(() => ajv.compile(result[0].schema.input)).not.toThrow();
    });
  });
});

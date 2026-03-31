import { GenerateGraphql } from "./generate-graphql";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

describe("generate-graphql-api", () => {
  it("should generate graphql api", async () => {
    const random = Math.random().toString(36).substring(2, 15);

    fs.mkdirSync(path.resolve(os.tmpdir(), random));

    await GenerateGraphql.handler({
      schema: path.resolve(process.cwd(), "src", "testdata", "link.schema.gql"),
      operations: path.resolve(
        process.cwd(),
        "src",
        "testdata",
        "link.operations.gql",
      ),
      name: "link",
      dir: path.resolve(os.tmpdir(), random),
    } as any);

    expect(
      fs.existsSync(
        path.resolve(os.tmpdir(), random, "link", "link.config.ts"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.resolve(os.tmpdir(), random, "link", "link.service.ts"),
      ),
    ).toBe(true);
    expect(
      fs
        .readFileSync(
          path.resolve(os.tmpdir(), random, "link", "link.config.ts"),
        )
        .toString(),
    ).toMatchSnapshot();
    expect(
      fs
        .readFileSync(
          path.resolve(os.tmpdir(), random, "link", "link.service.ts"),
        )
        .toString(),
    ).toMatchSnapshot();
    expect(
      fs.readFileSync(
        path.resolve(
          os.tmpdir(),
          random,
          "link",
          "functions",
          "link.MergePullRequest.ts",
        ),
        "utf-8",
      ),
    ).toMatchSnapshot();
  });
});

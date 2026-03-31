import { GenerateOpenApi } from "./generate-open-api";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

describe("generate-open-api", () => {
  it("should generate open api", async () => {
    const random = Math.random().toString(36).substring(2, 15);

    fs.mkdirSync(path.resolve(os.tmpdir(), random));

    await GenerateOpenApi.handler({
      schema: path.resolve(process.cwd(), "src", "testdata", "link.oas.yaml"),
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
  });
});

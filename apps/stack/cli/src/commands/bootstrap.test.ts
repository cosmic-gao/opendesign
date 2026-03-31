import { Bootstrap } from "./bootstrap";
import * as os from "os";
import { readdir } from "fs/promises";

describe("Bootstrap", () => {
  it.each(["node", "go", "dotnet", "proxy"])(
    "should bootstrap a new %s application",
    async (type) => {
      const dir = `${os.tmpdir()}/${Math.random().toString(36).substring(2, 15)}`;

      await Bootstrap.handler({
        dir,
        type: type as "node" | "go" | "proxy",
        "no-cluster": true,
        _: [],
        $0: "",
      });

      const contents = await readdir(dir);

      if (type === "node") {
        expect(contents).toContain("package.json");
        expect(contents).toContain("node_modules");
      }

      if (type === "proxy") {
        expect(contents).toContain("package.json");
        expect(contents).toContain("node_modules");
      }

      if (type === "go") {
        expect(contents).toContain("main.go");
        expect(contents).toContain("go.mod");
        expect(contents).toContain("go.sum");
      }

      if (type === "dotnet") {
        expect(contents).toContain("Program.cs");
        expect(contents).toContain("bootstrap-dotnet.csproj");
      }
    },
    20_000,
  );
});

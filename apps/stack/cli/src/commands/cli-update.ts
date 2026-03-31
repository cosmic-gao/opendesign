import { spawn } from "child_process";
import { CommandModule } from "yargs";

export const CliUpdate: CommandModule<{}, {}> = {
  command: "update",
  describe: "Updates the Inferable CLI globally",
  handler: async () => {
    return new Promise((resolve, reject) => {
      const child = spawn("npm", ["install", "-g", "inferable"]);

      console.log(`🔄 Updating Inferable CLI...`);

      child.stdout?.on("data", (data) => {
        console.debug(data.toString());
      });

      child.stderr?.on("data", (data) => {
        console.error(data.toString());
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("exit", (code) => {
        if (code === 0) {
          console.log(`✅ Inferable CLI updated successfully`);
          resolve();
        } else {
          console.error(`⛔️ Inferable CLI update failed with code ${code}`);
          reject();
        }
      });
    });
  },
};

import { exec } from "child_process";

export const openBrowser = async (url: string) => {
  if (process.platform === "darwin") {
    exec(`open ${url}`);
  } else if (process.platform === "linux") {
    exec(`xdg-open ${url}`);
  } else {
    console.log(`Please open your browser and navigate to ${url}`);
  }
};

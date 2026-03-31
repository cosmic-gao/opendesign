import { initClient, tsRestFetchApi } from "@ts-rest/core";
import { contract } from "../client/contract";

import { readContext } from "./context";
import { getToken, startTokenFlow } from "./auth";
import { askToLogin } from "../utils";

// TODO: deprecate this in favor of createClient
export const client = initClient(contract, {
  baseUrl: readContext().apiUrl,
  baseHeaders: {
    authorization: `Bearer ${getToken()}`,
    "x-cli-version": require("../../package.json").version,
  },
  api: (args) => {
    args.headers["authorization"] = `Bearer ${getToken()}`;

    return tsRestFetchApi(args).then((r) => {
      if (r.status === 401) {
        console.error(
          "Your token is invalid. Do you want to login again? (y/n)",
        );

        return new Promise((resolve, reject) => {
          const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          readline.question(
            "Do you want to login? (y/n)",
            async (answer: string) => {
              readline.close();
              if (answer.toLowerCase() === "y") {
                await startTokenFlow();
                console.log("Logged in. Retrying...");

                args.headers["authorization"] = `Bearer ${getToken()}`;
                resolve(tsRestFetchApi(args));
              } else {
                reject(new Error("User declined login"));
              }
            },
          );
        });
      }

      return r;
    });
  },
});

export const authenticatedClient = () => {
  const token = getToken();

  if (!token) {
    askToLogin();
    process.exit(1);
  }

  return initClient(contract, {
    baseUrl: readContext().apiUrl,
    baseHeaders: {
      authorization: `Bearer ${getToken()}`,
      "x-cli-version": require("../../package.json").version,
    },
    api: tsRestFetchApi,
  });
};

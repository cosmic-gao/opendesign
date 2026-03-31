import os from "os";
import path from "path";
import fs from "fs";
import http from "http";
import jwt from "jsonwebtoken";
import { openBrowser } from "../system";
import { readContext } from "./context";
import inquirer from "inquirer";
import { contract } from "../client/contract";
import { initClient, tsRestFetchApi } from "@ts-rest/core";

const CREDENTIALS_PATH = path.join(
  os.homedir(),
  ".inferable",
  "credentials.json",
);

const readConfig = () => {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const config = fs.readFileSync(CREDENTIALS_PATH, { encoding: "utf-8" });
    return JSON.parse(config);
  }
  return {};
};

export const storeToken = (token: string) => {
  const dir = path.dirname(CREDENTIALS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const config = {
    ...readConfig(),
    [readContext().apiUrl]: {
      token,
    },
  };

  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(config, null, 2));
};

export const getToken = () => {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const credentials = fs.readFileSync(CREDENTIALS_PATH, {
      encoding: "utf-8",
    });
    try {
      const token = JSON.parse(credentials)[readContext().apiUrl]?.token;
      if (!token) {
        return null;
      }
      const decoded = jwt.decode(token, { complete: true });
      if (
        decoded &&
        typeof decoded.payload === "object" &&
        "exp" in decoded.payload
      ) {
        const expirationTime = decoded.payload.exp as number;
        if (Date.now() >= expirationTime * 1000) {
          // Token has expired
          return null;
        }
      }
      return token;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }
  return null;
};

export const startTokenFlow = async () => {
  if (!readContext().apiUrl.includes("inferable.ai")) {
    const token = await inquirer.prompt({
      type: "password",
      name: "token",
      message: `Please provide MASTER_API_SECRET for instance: '${readContext().apiUrl}'`,
    });

    if (!token.token) {
      console.error("No API token provided");
      process.exit(1);
    }

    const testClient = initClient(contract, {
      baseUrl: readContext().apiUrl,
      baseHeaders: {
        authorization: `Bearer ${token.token}`,
        "x-cli-version": require("../../package.json").version,
      },
      api: tsRestFetchApi,
    });

    const testResponse = await testClient.listClusters();

    if (testResponse.status !== 200) {
      console.error("Recieved unsuccessful response from instance", {
        instance: readContext().apiUrl,
        status: testResponse.status,
        response: testResponse.body,
      });
      process.exit(1);
    }

    storeToken(token.token);

    return;
  }

  await cloudTokenFlow();
};

const cloudTokenFlow = () => {
  return new Promise<string>((resolve, reject) => {
    // TODO: #135 Migrate cli-auth page so inferable auth login works again
    const authUrl = `${readContext().appUrl}/cli-auth`;
    openBrowser(authUrl);

    console.log("Listening at port 9999 for authentication...");
    const server = http
      .createServer((req, res) => {
        // Add a timeout to prevent the function from hanging indefinitely
        const timeout = setTimeout(() => {
          server.close();
          reject(new Error("Authentication timed out"));
        }, 300000); // 5 minutes timeout

        const token = new URL(
          req.url ?? "",
          "http://localhost:9999",
        ).searchParams.get("token");
        if (token) {
          storeToken(token);
          console.log("The Inferable CLI has been authenticated.");
          const body = `
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f4f4f5;
              color: #09090b;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background-color: #ffffff;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              max-width: 24rem;
              width: 100%;
            }
            h1 {
              color: #18181b;
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
            }
            p {
              color: #52525b;
              margin-bottom: 1.5rem;
            }
          </style>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.close();
                if (!window.closed) {
                  document.body.innerHTML = '<p>You can now close this window and return to the CLI.</p>';
                }
              }, 3000);
            }
          </script>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Successful</h1>
            <p>You have been authenticated. This window will close automatically in 3 seconds.</p>
          </div>
        </body>
      </html>`;
          res.writeHead(200, { "Content-Type": "text/html" });
          res.write(body, () =>
            res.end(() => {
              server.close();
              clearTimeout(timeout);
              resolve(token);
            }),
          );
        } else {
          console.error("Failed to authenticate.");
          const body = `
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f4f4f5;
              color: #09090b;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background-color: #ffffff;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              max-width: 24rem;
              width: 100%;
            }
            h1 {
              color: #18181b;
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
            }
            p {
              color: #52525b;
              margin-bottom: 1.5rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Authentication Failed</h1>
            <p>Something went wrong. Please try again.</p>
          </div>
        </body>
      </html>`;
          res.writeHead(400, { "Content-Type": "text/html" });
          res.write(body, () =>
            res.end(() => {
              server.close();
              clearTimeout(timeout);
              reject(new Error("Authentication failed"));
            }),
          );
        }
      })
      .listen(9999);
  });
};

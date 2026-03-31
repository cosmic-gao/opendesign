import { Auth } from "../../src/modules/auth/auth";

declare module "fastify" {
  interface FastifyRequest {
    auth: Auth | undefined;
    getAuth: () => Auth;
  }
}

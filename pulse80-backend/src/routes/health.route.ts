import type { FastifyPluginAsync } from "fastify";

import { env } from "../config/env.js";

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    status: "ok",
    service: "pulse80-backend",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }));
};

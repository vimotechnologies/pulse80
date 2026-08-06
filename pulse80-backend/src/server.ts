import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

async function start(): Promise<void> {
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error, "Backend startup failed");
    process.exitCode = 1;
  }
}

let isShuttingDown = false;

async function shutDown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  app.log.info({ signal }, "Shutting down the backend");
  await app.close();
}

process.on("SIGINT", () => void shutDown("SIGINT"));
process.on("SIGTERM", () => void shutDown("SIGTERM"));

await start();

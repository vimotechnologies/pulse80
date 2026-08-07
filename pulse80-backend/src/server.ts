import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  const app = await buildApp();

  const shutdown = async (
    signal: NodeJS.Signals,
  ): Promise<void> => {
    app.log.info(
      { signal },
      "Shutdown signal received.",
    );

    try {
      await app.close();

      app.log.info("Pulse80 backend stopped.");
      process.exit(0);
    } catch (error) {
      app.log.error(
        error,
        "Failed to stop Pulse80 backend cleanly.",
      );

      process.exit(1);
    }
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  try {
    const address = await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    app.log.info(
      {
        address,
        graphql: `${address}/graphql`,
        health: `${address}/health`,
      },
      "Pulse80 backend started.",
    );
  } catch (error) {
    app.log.error(
      error,
      "Pulse80 backend failed to start.",
    );

    process.exit(1);
  }
}

void startServer();
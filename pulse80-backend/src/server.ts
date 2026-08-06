import { createServer } from "node:http";

import { env } from "./config/env.js";

const server = createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", env.FRONTEND_URL);
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200);
    response.end(
      JSON.stringify({
        status: "ok",
        service: "pulse80-backend",
        environment: env.NODE_ENV,
      }),
    );
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Pulse80 backend listening on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

function shutDown(signal: NodeJS.Signals): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}; shutting down the backend.`);
  server.close((error) => {
    if (error) {
      console.error("Backend shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

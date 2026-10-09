import type { IncomingMessage, ServerResponse } from "node:http";

import { buildApp } from "../src/app.js";

const app = await buildApp();
await app.ready();

export default function handler(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  app.server.emit("request", request, response);
}

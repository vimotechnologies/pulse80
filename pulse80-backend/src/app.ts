import cors from "@fastify/cors";
import Fastify, {
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { createYoga } from "graphql-yoga";

import { env } from "./config/env.js";
import {
  createGraphQLContext,
} from "./graphql/context.js";
import { schema } from "./graphql/schema.js";
import { healthRoute } from "./routes/health.route.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  await app.register(healthRoute);

  const yoga = createYoga<{
    req: FastifyRequest;
    reply: FastifyReply;
  }>({
    schema,
    graphqlEndpoint: "/graphql",
    graphiql: env.NODE_ENV !== "production",
    context: ({ req, reply }) => createGraphQLContext({ req, reply }),
  });

  app.route({
    url: yoga.graphqlEndpoint,
    method: ["GET", "POST", "OPTIONS"],
    handler: (request, reply) =>
      yoga.handleNodeRequestAndResponse(request, reply, {
        req: request,
        reply,
      }),
  });

  return app;
}

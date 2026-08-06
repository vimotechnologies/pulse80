import cors from "@fastify/cors";
import Fastify, {
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { createYoga } from "graphql-yoga";

import { env } from "./config/env.js";
import { schema } from "./graphql/schema.js";
import { healthRoute } from "./routes/health.route.js";

type GraphQLServerContext = {
  request: FastifyRequest;
  reply: FastifyReply;
};

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  await app.register(healthRoute);

  const yoga = createYoga<GraphQLServerContext>({
    schema,
    graphqlEndpoint: "/graphql",
  });

  app.route({
    url: yoga.graphqlEndpoint,
    method: ["GET", "POST", "OPTIONS"],
    handler: (request, reply) =>
      yoga.handleNodeRequestAndResponse(request, reply, { request, reply }),
  });

  return app;
}

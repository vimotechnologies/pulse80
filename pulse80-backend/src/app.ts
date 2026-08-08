import cors from "@fastify/cors";
import Fastify from "fastify";
import { GraphQLError } from "graphql";
import { createYoga } from "graphql-yoga";

import { env } from "./config/env.js";
import {
  createGraphQLContext,
  type GraphQLContext,
} from "./graphql/context.js";
import { schema } from "./graphql/schema.js";
import { healthRoute } from "./routes/health.route.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  await app.register(healthRoute);

  const yoga = createYoga<GraphQLContext>({
    schema,
    graphqlEndpoint: "/graphql",
    graphiql: env.NODE_ENV !== "production",
  });

  app.route({
    url: yoga.graphqlEndpoint,
    method: ["GET", "POST", "OPTIONS"],
    handler: async (request, reply) => {
      try {
        const context = await createGraphQLContext(request, reply);

        return yoga.handleNodeRequestAndResponse(request, reply, context);
      } catch (error) {
        if (error instanceof GraphQLError) {
          const status = error.extensions.http as { status?: number } | undefined;

          return reply.status(status?.status ?? 401).send({
            errors: [
              {
                message: error.message,
                extensions: { code: error.extensions.code },
              },
            ],
          });
        }

        throw error;
      }
    },
  });

  return app;
}

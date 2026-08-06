import { makeExecutableSchema } from "@graphql-tools/schema";

import { env } from "../config/env.js";

const baseTypeDefs = /* GraphQL */ `
  """
  Current operational state of the Pulse80 backend.
  """
  type SystemHealth {
    status: String!
    service: String!
    environment: String!
    timestamp: String!
  }

  type Query {
    """
    Confirms that the GraphQL API is operational.
    """
    health: SystemHealth!
  }

  type Mutation {
    """
    Temporary root mutation placeholder.

    This will be replaced as business modules are added.
    """
    _empty: Boolean
  }
`;

const baseResolvers = {
  Query: {
    health: () => ({
      status: "ok",
      service: "pulse80-backend",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }),
  },

  Mutation: {
    _empty: () => true,
  },
};

// Each modular-monolith module can contribute another schema definition and
// resolver object to these arrays. Module definitions can then safely use
// `extend type Query` and `extend type Mutation`.
const typeDefinitions = [baseTypeDefs];
const resolverDefinitions = [baseResolvers];

export const schema = makeExecutableSchema({
  typeDefs: typeDefinitions,
  resolvers: resolverDefinitions,
});

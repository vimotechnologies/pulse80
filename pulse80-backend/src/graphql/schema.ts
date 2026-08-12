import { makeExecutableSchema } from "@graphql-tools/schema";

import { authResolvers } from "../modules/auth/auth.resolver.js";
import { authTypeDefs } from "../modules/auth/auth.schema.js";

const rootTypeDefs = /* GraphQL */ `
  type SystemHealth {
    status: String!
    service: String!
    timestamp: String!
  }

  type Query {
    health: SystemHealth!
  }

  type Mutation {
    _empty: Boolean
  }
`;

const rootResolvers = {
  Query: {
    health: () => ({
      status: "ok",
      service: "pulse80-backend",
      timestamp: new Date().toISOString(),
    }),
  },

  Mutation: {
    _empty: () => true,
  },
};

export const schema = makeExecutableSchema({
  typeDefs: [rootTypeDefs, authTypeDefs],
  resolvers: [rootResolvers, authResolvers],
});

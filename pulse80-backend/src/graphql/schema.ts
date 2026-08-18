import { makeExecutableSchema } from "@graphql-tools/schema";

import { authResolvers } from "../modules/auth/auth.resolver.js";
import { authTypeDefs } from "../modules/auth/auth.schema.js";
import { organisationResolvers } from "../modules/organisations/organisation.resolver.js";
import { organisationTypeDefs } from "../modules/organisations/organisation.schema.js";
import { practitionerResolvers } from "../modules/practitioners/practitioner.resolver.js";
import { practitionerTypeDefs } from "../modules/practitioners/practitioner.schema.js";
import { programmeResolvers } from "../modules/programmes/programme.resolver.js";
import { programmeTypeDefs } from "../modules/programmes/programme.schema.js";

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
  typeDefs: [rootTypeDefs, authTypeDefs, organisationTypeDefs, practitionerTypeDefs, programmeTypeDefs],
  resolvers: [rootResolvers, authResolvers, organisationResolvers, practitionerResolvers, programmeResolvers],
});

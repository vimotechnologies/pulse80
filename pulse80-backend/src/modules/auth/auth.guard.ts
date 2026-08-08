import type { SupabaseClient, User } from "@supabase/supabase-js";
import { GraphQLError } from "graphql";

import type { Database } from "../../generated/database.types.js";
import type { GraphQLContext } from "../../graphql/context.js";

export type AuthenticatedGraphQLContext = GraphQLContext & {
  accessToken: string;
  user: User;
  supabase: SupabaseClient<Database>;
};

export function requireAuthentication(
  context: GraphQLContext,
): asserts context is AuthenticatedGraphQLContext {
  if (!context.accessToken || !context.user || !context.supabase) {
    throw new GraphQLError("Authentication Error", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    });
  }
}

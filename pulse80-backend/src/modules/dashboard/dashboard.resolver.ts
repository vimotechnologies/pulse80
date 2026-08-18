import type { GraphQLContext } from "../../graphql/context.js";
import { requirePlatformPermission } from "../auth/auth.guard.js";
import { DashboardService } from "./dashboard.service.js";

export const dashboardResolvers = {
  Query: {
    adminDashboardStats: async (
      _parent: unknown,
      _arguments: unknown,
      context: GraphQLContext,
    ) => {
      requirePlatformPermission(context, "analytics:read");

      return new DashboardService(context.adminSupabase).getAdminStats();
    },
  },
};

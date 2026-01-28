import { z } from "zod";
import { insertUserSchema, insertTicketSchema, insertWarLogSchema, insertPvpLogSchema, insertWarTeamSchema, users, tickets, warLogs, pvpLogs, warTeams, ticketMessages } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  tickets: {
    list: {
      method: "GET" as const,
      path: "/api/tickets",
      responses: {
        200: z.array(z.custom<typeof tickets.$inferSelect & { creator: typeof users.$inferSelect, assignee?: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/tickets/:id",
      responses: {
        200: z.custom<typeof tickets.$inferSelect & { messages: (typeof ticketMessages.$inferSelect & { sender: typeof users.$inferSelect })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/tickets",
      input: insertTicketSchema,
      responses: {
        201: z.custom<typeof tickets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/tickets/:id",
      input: insertTicketSchema.partial(),
      responses: {
        200: z.custom<typeof tickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    addMessage: {
      method: "POST" as const,
      path: "/api/tickets/:id/messages",
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof ticketMessages.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    users: {
      method: "GET" as const,
      path: "/api/admin/users",
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
        403: errorSchemas.unauthorized,
      },
    },
    updateUser: {
      method: "PATCH" as const,
      path: "/api/admin/users/:id",
      input: z.object({ role: z.enum(["admin", "moderator", "member", "guest", "war_fighter"]) }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  warTeam: {
    list: {
      method: "GET" as const,
      path: "/api/war-teams",
      responses: {
        200: z.array(z.custom<typeof warTeams.$inferSelect>()),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/war-teams/:id",
      input: z.object({ memberIds: z.array(z.number()).optional() }),
      responses: {
        200: z.custom<typeof warTeams.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  warLogs: {
    list: {
      method: "GET" as const,
      path: "/api/war-logs",
      responses: {
        200: z.array(z.custom<typeof warLogs.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/war-logs",
      input: insertWarLogSchema,
      responses: {
        201: z.custom<typeof warLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  pvpLogs: {
    list: {
      method: "GET" as const,
      path: "/api/pvp-logs",
      responses: {
        200: z.array(z.custom<typeof pvpLogs.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/pvp-logs",
      input: insertPvpLogSchema,
      responses: {
        201: z.custom<typeof pvpLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  discordId: text("discord_id").unique(),
  avatar: text("avatar"),
  role: text("role", { enum: ["admin", "moderator", "member", "guest"] }).default("guest").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// === TICKETS ===
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["tryout", "war_request"] }).notNull(),
  status: text("status", { enum: ["open", "pending", "closed"] }).default("open").notNull(),
  creatorId: integer("creator_id").notNull(), // User who created the ticket
  assigneeId: integer("assignee_id"), // Admin handling it
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true });

// === WAR LOGS ===
export const warLogs = pgTable("war_logs", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["2v2", "3v3", "6v6", "public"] }).notNull(),
  opponentCrew: text("opponent_crew").notNull(),
  result: text("result", { enum: ["win", "loss"] }).notNull(),
  score: text("score").notNull(), // e.g., "3-0"
  proofImage: text("proof_image"),
  loggedBy: integer("logged_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWarLogSchema = createInsertSchema(warLogs).omit({ id: true, createdAt: true });

// === 1V1 LOGS ===
export const pvpLogs = pgTable("pvp_logs", {
  id: serial("id").primaryKey(),
  winnerId: integer("winner_id").notNull(),
  loserName: text("loser_name").notNull(), // Can be external user or crew member
  score: text("score").notNull(),
  proofImage: text("proof_image"),
  loggedBy: integer("logged_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPvpLogSchema = createInsertSchema(pvpLogs).omit({ id: true, createdAt: true });

// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets, { relationName: "creator" }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
  warLogs: many(warLogs),
  pvpLogs: many(pvpLogs),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  creator: one(users, {
    fields: [tickets.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
}));

export const warLogsRelations = relations(warLogs, ({ one }) => ({
  logger: one(users, {
    fields: [warLogs.loggedBy],
    references: [users.id],
  }),
}));

export const pvpLogsRelations = relations(pvpLogs, ({ one }) => ({
  winner: one(users, {
    fields: [pvpLogs.winnerId],
    references: [users.id],
  }),
  logger: one(users, {
    fields: [pvpLogs.loggedBy],
    references: [users.id],
  }),
}));

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type WarLog = typeof warLogs.$inferSelect;
export type InsertWarLog = z.infer<typeof insertWarLogSchema>;

export type PvpLog = typeof pvpLogs.$inferSelect;
export type InsertPvpLog = z.infer<typeof insertPvpLogSchema>;

import { db } from "./db";
import { users, tickets, warLogs, pvpLogs, type User, type InsertUser, type Ticket, type InsertTicket, type WarLog, type InsertWarLog, type PvpLog, type InsertPvpLog } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Tickets
  getTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket>;

  // War Logs
  getWarLogs(): Promise<WarLog[]>;
  createWarLog(log: InsertWarLog): Promise<WarLog>;

  // PvP Logs
  getPvpLogs(): Promise<PvpLog[]>;
  createPvpLog(log: InsertPvpLog): Promise<PvpLog>;
}

export class DatabaseStorage implements IStorage {
  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Tickets
  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(insertTicket).returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [ticket] = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
    return ticket;
  }

  // War Logs
  async getWarLogs(): Promise<WarLog[]> {
    return await db.select().from(warLogs).orderBy(desc(warLogs.createdAt));
  }

  async createWarLog(insertLog: InsertWarLog): Promise<WarLog> {
    const [log] = await db.insert(warLogs).values(insertLog).returning();
    return log;
  }

  // PvP Logs
  async getPvpLogs(): Promise<PvpLog[]> {
    return await db.select().from(pvpLogs).orderBy(desc(pvpLogs.createdAt));
  }

  async createPvpLog(insertLog: InsertPvpLog): Promise<PvpLog> {
    const [log] = await db.insert(pvpLogs).values(insertLog).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();

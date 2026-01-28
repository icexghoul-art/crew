import { db } from "./db";
import { users, tickets, ticketMessages, warLogs, pvpLogs, warTeams, type User, type InsertUser, type Ticket, type InsertTicket, type WarLog, type InsertWarLog, type PvpLog, type InsertPvpLog, type InsertTicketMessage, type WarTeam, type InsertWarTeam } from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tickets
  getTickets(): Promise<(Ticket & { creator: User, assignee?: User })[]>;
  getTicketWithMessages(id: number): Promise<(Ticket & { messages: any[] }) | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket>;
  addTicketMessage(message: InsertTicketMessage): Promise<any>;

  // War Logs
  getWarLogs(): Promise<WarLog[]>;
  createWarLog(log: InsertWarLog): Promise<WarLog>;

  // PvP Logs
  getPvpLogs(): Promise<PvpLog[]>;
  createPvpLog(log: InsertPvpLog): Promise<PvpLog>;
  
  // War Teams
  getWarTeams(): Promise<WarTeam[]>;
  updateWarTeam(id: number, updates: Partial<InsertWarTeam>): Promise<WarTeam>;
}

export class DatabaseStorage implements IStorage {
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getTickets(): Promise<(Ticket & { creator: User, assignee?: User })[]> {
    const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
    const ticketsWithUsers = await Promise.all(rows.map(async (ticket) => {
      const creator = await this.getUser(ticket.creatorId);
      const assignee = ticket.assigneeId ? await this.getUser(ticket.assigneeId) : undefined;
      return { ...ticket, creator: creator!, assignee };
    }));
    return ticketsWithUsers;
  }

  async getTicketWithMessages(id: number): Promise<(Ticket & { messages: any[] }) | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) return undefined;
    
    const messages = await db.select().from(ticketMessages)
      .where(eq(ticketMessages.ticketId, id))
      .orderBy(ticketMessages.createdAt);
      
    const messagesWithSenders = await Promise.all(messages.map(async (m) => {
      const sender = await this.getUser(m.senderId);
      return { ...m, sender: sender! };
    }));
    
    return { ...ticket, messages: messagesWithSenders };
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(insertTicket).returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket> {
    const [ticket] = await db.update(tickets).set(updates).where(eq(tickets.id, id)).returning();
    return ticket;
  }

  async addTicketMessage(message: InsertTicketMessage): Promise<any> {
    const [msg] = await db.insert(ticketMessages).values(message).returning();
    const sender = await this.getUser(msg.senderId);
    return { ...msg, sender: sender! };
  }

  async getWarLogs(): Promise<WarLog[]> {
    return await db.select().from(warLogs).orderBy(desc(warLogs.createdAt));
  }

  async createWarLog(insertLog: InsertWarLog): Promise<WarLog> {
    const [log] = await db.insert(warLogs).values(insertLog).returning();
    return log;
  }

  async getPvpLogs(): Promise<PvpLog[]> {
    return await db.select().from(pvpLogs).orderBy(desc(pvpLogs.createdAt));
  }

  async createPvpLog(insertLog: InsertPvpLog): Promise<PvpLog> {
    const [log] = await db.insert(pvpLogs).values(insertLog).returning();
    return log;
  }

  async getWarTeams(): Promise<WarTeam[]> {
    return await db.select().from(warTeams).orderBy(warTeams.tier);
  }

async updateWarTeam(id: number, updates: Partial<InsertWarTeam>): Promise<WarTeam> {
  // Assurer que memberIds est bien un tableau de nombres
  const memberIdsArray: number[] | undefined = updates.memberIds
    ? Array.from(updates.memberIds).map(Number) // forcer chaque élément en number
    : undefined;

  const [team] = await db.update(warTeams)
    .set({ ...updates, memberIds: memberIdsArray, updatedAt: new Date() })
    .where(eq(warTeams.id, id))
    .returning();

  return team;
}
}

export const storage = new DatabaseStorage();

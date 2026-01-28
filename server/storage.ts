import { eq } from "drizzle-orm";
import { db } from "./db";
import { warTeams, ticketMessages } from "@shared/schema";

// --- War Teams ---

export async function updateWarTeam(id: number, updates: Partial<{
  tier: "A" | "Z" | "Y" | "X" | "S";
  memberIds: number[];
  updatedAt: Date;
}>) {
// Suppose que updates.memberIds peut être array-like
const memberIdsArray: number[] = Array.isArray(updates.memberIds)
    ? updates.memberIds
    : Array.from(updates.memberIds || []);

const [team] = await db.update(warTeams)
  .set({ ...updates, memberIds: memberIdsArray, updatedAt: new Date() })
  .where(eq(warTeams.id, id))
  .returning();
}

export async function addWarTeam(team: {
  tier: "A" | "Z" | "Y" | "X" | "S";
  memberIds: number[];
}) {
  const [newTeam] = await db.insert(warTeams)
    .values({ ...team, updatedAt: new Date() })
    .returning();

  return newTeam;
}

// --- Ticket Messages ---

export async function addTicketMessage(ticketId: number, message: string, authorId: number) {
  const [newMessage] = await db.insert(ticketMessages)
    .values({
      ticketId,
      message,
      authorId,
      createdAt: new Date(),
    })
    .returning();

  return newMessage;
}

export async function getTicketMessages(ticketId: number) {
  const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId));
  return messages;
}

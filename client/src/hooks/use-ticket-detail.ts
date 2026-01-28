import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTicketWithMessages(ticketId: number) {
  return useQuery({
    queryKey: [`/api/tickets/${ticketId}`],
    queryFn: async () => {
      // Chercher dans api.tickets pour trouver la route details
      const ticketPath = Object.values(api.tickets).find((t: any) => t.path === "/api/tickets/:id");
      const path = ticketPath?.path.replace(":id", ticketId.toString()) || `/api/tickets/${ticketId}`;
      
      const res = await fetch(path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch ticket");
      return res.json();
    },
    enabled: !!ticketId,
  });
}

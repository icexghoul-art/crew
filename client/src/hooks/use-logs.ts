import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertWarLog, type InsertPvpLog } from "@shared/schema";

// === WAR LOGS ===
export function useWarLogs() {
  return useQuery({
    queryKey: [api.warLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.warLogs.list.path);
      if (!res.ok) throw new Error("Failed to fetch war logs");
      return api.warLogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWarLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: InsertWarLog) => {
      const res = await fetch(api.warLogs.create.path, {
        method: api.warLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      if (!res.ok) throw new Error("Failed to create war log");
      return api.warLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.warLogs.list.path] });
    },
  });
}

// === PVP LOGS ===
export function usePvpLogs() {
  return useQuery({
    queryKey: [api.pvpLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.pvpLogs.list.path);
      if (!res.ok) throw new Error("Failed to fetch pvp logs");
      return api.pvpLogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePvpLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: InsertPvpLog) => {
      const res = await fetch(api.pvpLogs.create.path, {
        method: api.pvpLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      if (!res.ok) throw new Error("Failed to create pvp log");
      return api.pvpLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pvpLogs.list.path] });
    },
  });
}

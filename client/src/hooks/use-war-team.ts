import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useWarTeams() {
  return useQuery({
    queryKey: [api.warTeam.list.path],
    queryFn: async () => {
      const res = await fetch(api.warTeam.list.path);
      if (!res.ok) throw new Error("Failed to fetch war teams");
      return api.warTeam.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateWarTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, memberIds }: { id: number; memberIds: number[] }) => {
      const url = buildUrl(api.warTeam.update.path, { id });
      const res = await fetch(url, {
        method: api.warTeam.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds }),
      });
      if (!res.ok) throw new Error("Failed to update war team");
      return api.warTeam.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.warTeam.list.path] });
    },
  });
}

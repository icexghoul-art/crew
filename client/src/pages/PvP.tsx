import { usePvpLogs, useCreatePvpLog } from "@/hooks/use-logs";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPvpLogSchema, type InsertPvpLog } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Swords } from "lucide-react";

export default function PvP() {
  const { data: logs, isLoading } = usePvpLogs();
  const { data: user } = useUser();

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
              1V1 ARENA
            </h1>
            <p className="text-muted-foreground mt-2">Recent duels and training matches.</p>
          </div>
          {user && <LogPvpModal />}
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {logs?.map((log) => (
              <Card key={log.id} className="p-4 bg-secondary border-white/10 flex items-center justify-between hover:bg-secondary/80 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="text-sm text-muted-foreground w-24">
                    {new Date(log.createdAt!).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary text-lg">Winner (ID: {log.winnerId})</span>
                    <Swords className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-red-400">{log.loserName}</span>
                  </div>
                </div>
                <div className="font-mono font-bold text-xl">{log.score}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogPvpModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreatePvpLog();
  const { toast } = useToast();
  const { data: user } = useUser();

  const form = useForm<InsertPvpLog>({
    resolver: zodResolver(insertPvpLogSchema),
    defaultValues: {
      winnerId: user?.id || 0,
      loserName: "",
      score: "3-0",
      loggedBy: user?.id || 0,
    },
  });

  const onSubmit = (data: InsertPvpLog) => {
    if (!user) return;
    mutate({ ...data, loggedBy: user.id }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Match Logged", description: "GG!" });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Swords className="w-4 h-4 mr-2" /> Log Match
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-secondary border-white/10">
        <DialogHeader>
          <DialogTitle>Log 1v1 Result</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="winnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Winner ID (Internal)</FormLabel>
                  <FormControl>
                     {/* Simplified for now - assumes logged in user won or knows ID */}
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="loserName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loser Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score</FormLabel>
                  <FormControl>
                    <Input placeholder="3-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging..." : "Submit"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

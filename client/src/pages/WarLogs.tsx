import { useWarLogs, useCreateWarLog } from "@/hooks/use-logs";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWarLogSchema, type InsertWarLog } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sword, Trophy, Skull } from "lucide-react";
import { motion } from "framer-motion";

export default function WarLogs() {
  const { data: logs, isLoading } = useWarLogs();
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              WAR LOGS
            </h1>
            <p className="text-muted-foreground mt-2">History of our battles on the seas.</p>
          </div>
          {isAdmin && <LogWarModal />}
        </div>

        {isLoading ? (
          <div className="text-center py-20">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs?.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden border-l-4 ${log.result === "win" ? "border-l-green-500" : "border-l-red-500"} bg-secondary border-white/10 hover:bg-secondary/80 transition-colors`}>
                  <CardContent className="p-0">
                    <div className="p-6 relative">
                      <div className="absolute top-4 right-4">
                        <Badge variant="outline" className="border-white/10 bg-black/20 text-xs">
                          {new Date(log.createdAt!).toLocaleDateString()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${log.result === "win" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} hover:bg-opacity-30 border-none uppercase tracking-widest text-[10px]`}>
                          {log.result}
                        </Badge>
                        <Badge variant="secondary" className="uppercase text-[10px]">{log.type}</Badge>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold font-display">OCEAN</div>
                        <div className="text-2xl font-black font-mono text-white/50 px-4">VS</div>
                        <div className="text-xl font-bold font-display text-primary truncate max-w-[100px] text-right" title={log.opponentCrew}>
                          {log.opponentCrew}
                        </div>
                      </div>

                      <div className="text-center bg-black/20 py-2 rounded mb-4">
                         <span className="text-3xl font-black font-display tracking-widest">{log.score}</span>
                      </div>
                      
                      {log.proofImage && (
                        <a href={log.proofImage} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block text-center">
                          View Proof
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LogWarModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateWarLog();
  const { toast } = useToast();
  const { data: user } = useUser();

  const form = useForm<InsertWarLog>({
    resolver: zodResolver(insertWarLogSchema),
    defaultValues: {
      type: "3v3",
      result: "win",
      score: "3-0",
      opponentCrew: "",
      loggedBy: user?.id || 0,
    },
  });

  const onSubmit = (data: InsertWarLog) => {
    if (!user) return;
    mutate({ ...data, loggedBy: user.id }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "War Logged", description: "The victory has been recorded." });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
          <Sword className="w-4 h-4" /> Log War
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-secondary border-white/10">
        <DialogHeader>
          <DialogTitle>Log War Result</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2v2">2v2</SelectItem>
                      <SelectItem value="3v3">3v3</SelectItem>
                      <SelectItem value="6v6">6v6</SelectItem>
                      <SelectItem value="public">Public Server</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opponentCrew"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opponent Crew</FormLabel>
                  <FormControl>
                    <Input placeholder="Crew Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Result" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="e.g. 3-0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="proofImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proof Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Logging..." : "Submit Log"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useUser } from "@/hooks/use-auth";
import { useTickets } from "@/hooks/use-tickets";
import { TicketModal } from "@/components/TicketModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Clock, CheckCircle2, XCircle, Shield } from "lucide-react";
import { Redirect } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  if (userLoading) return <div className="h-screen flex items-center justify-center text-primary">Loading...</div>;
  if (!user) return <Redirect to="/" />;

  const myTickets = tickets?.filter(t => t.creatorId === user.id) || [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        
        {/* Header Profile */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 text-primary text-2xl font-bold font-display">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display text-white">{user.username}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="uppercase tracking-wider text-xs font-semibold">{user.role}</span>
              </div>
            </div>
          </div>
          <TicketModal />
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="bg-secondary border border-white/5 mb-8">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-white">My Tickets</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-secondary/30 rounded-2xl border border-white/5 border-dashed">
                  <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Tickets Yet</h3>
                  <p className="text-muted-foreground">Create a ticket to request a tryout or schedule a war.</p>
                </div>
              ) : (
                myTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="bg-secondary border-white/10 hover:border-primary/30 transition-all h-full">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="uppercase tracking-wider text-[10px] border-primary/30 text-primary">
                            {ticket.type.replace('_', ' ')}
                          </Badge>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <CardTitle className="text-lg mt-2 font-display">Ticket #{ticket.id}</CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(ticket.createdAt!).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {ticket.content}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
             <div className="text-center py-20 bg-secondary/30 rounded-2xl border border-white/5">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">Detailed activity logs will appear here.</p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "open") return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-none"><Clock className="w-3 h-3 mr-1" /> Open</Badge>;
  if (status === "pending") return <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  if (status === "closed") return <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Closed</Badge>;
  return null;
}

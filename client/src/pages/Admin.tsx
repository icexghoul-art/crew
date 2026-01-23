import { useUser } from "@/hooks/use-auth";
import { useTickets, useUpdateTicket } from "@/hooks/use-tickets";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { mutate: updateTicket } = useUpdateTicket();
  const { toast } = useToast();

  if (userLoading) return <div>Loading...</div>;
  if (!user || (user.role !== "admin" && user.role !== "moderator")) return <Redirect to="/" />;

  const handleStatusChange = (id: number, status: "open" | "pending" | "closed") => {
    updateTicket({ id, updates: { status, assigneeId: user.id } }, {
      onSuccess: () => toast({ title: "Updated", description: `Ticket #${id} is now ${status}` }),
    });
  };

  const pendingTickets = tickets?.filter(t => t.status !== "closed") || [];
  const closedTickets = tickets?.filter(t => t.status === "closed") || [];

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold font-display mb-8">Admin Panel</h1>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Open Tickets ({pendingTickets.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingTickets.map(ticket => (
              <TicketAdminCard 
                key={ticket.id} 
                ticket={ticket} 
                onStatusChange={handleStatusChange} 
              />
            ))}
            {pendingTickets.length === 0 && <p className="text-muted-foreground">No open tickets.</p>}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {closedTickets.map(ticket => (
              <TicketAdminCard 
                key={ticket.id} 
                ticket={ticket} 
                onStatusChange={handleStatusChange} 
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TicketAdminCard({ ticket, onStatusChange }: any) {
  return (
    <Card className="bg-secondary border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">
            #{ticket.id} - <span className="capitalize">{ticket.type.replace("_", " ")}</span>
          </CardTitle>
          <CardDescription>Created: {new Date(ticket.createdAt).toLocaleDateString()}</CardDescription>
        </div>
        <Badge variant={ticket.status === "open" ? "default" : "secondary"}>
          {ticket.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm">{ticket.content}</p>
        <div className="flex gap-2">
          {ticket.status !== "pending" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(ticket.id, "pending")}>
              Mark Pending
            </Button>
          )}
          {ticket.status !== "closed" && (
            <Button size="sm" onClick={() => onStatusChange(ticket.id, "closed")}>
              Close Ticket
            </Button>
          )}
          {ticket.status === "closed" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(ticket.id, "open")}>
              Reopen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

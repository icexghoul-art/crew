import { useUser } from "@/hooks/use-auth";
import { useTickets, useUpdateTicket } from "@/hooks/use-tickets";
import { useWarTeams, useUpdateWarTeam } from "@/hooks/use-war-team";
import { TicketChat } from "@/components/TicketChat";
import { Redirect } from "wouter";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";

export default function Admin() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: teams, isLoading: teamsLoading } = useWarTeams();
  const { mutate: updateTicket } = useUpdateTicket();
  const { mutate: updateWarTeam } = useUpdateWarTeam();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Fetch all users for war team management
  useEffect(() => {
    if (user && user.role === "admin") {
      setUsersLoading(true);
      apiFetch("/api/admin/users")
        .then(res => res.json())
        .then(data => {
          setAllUsers(data);
          setUsersLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
          setUsersLoading(false);
        });
    }
  }, [user?.role]);

  // Update selected team members when a team is selected
  useEffect(() => {
    if (selectedTeamId && teams) {
      const team = teams.find(t => t.id === selectedTeamId);
      if (team) {
        setTeamMembers(team.memberIds || []);
        // Ensure users are loaded
        if (allUsers.length === 0 && user?.role === "admin") {
          setUsersLoading(true);
          apiFetch("/api/admin/users")
            .then(res => res.json())
            .then(data => {
              setAllUsers(data);
              setUsersLoading(false);
            })
            .catch(err => {
              console.error("Failed to fetch users:", err);
              setUsersLoading(false);
            });
        }
      }
    }
  }, [selectedTeamId, teams, allUsers.length, user?.role]);

  if (userLoading) return <div>Loading...</div>;
  if (!user || !["admin", "moderator", "tryouter", "war_fighter"].includes(user.role)) {
    return <Redirect to="/" />;
  }

  const handleStatusChange = (id: number, status: "open" | "pending" | "closed") => {
    updateTicket({ id, updates: { status, assigneeId: user.id } }, {
      onSuccess: () => toast({ title: "Updated", description: `Ticket #${id} is now ${status}` }),
    });
  };

  const handleAddMemberToTeam = (userId: number) => {
    if (selectedTeamId && !teamMembers.includes(userId)) {
      const newMembers = [...teamMembers, userId];
      setTeamMembers(newMembers);
      updateWarTeam({ id: selectedTeamId, memberIds: newMembers }, {
        onSuccess: () => {
          toast({ title: "Updated", description: "Member added to team" });
          setSearchQuery("");
          setShowAddMenu(false);
        },
        onError: () => {
          setTeamMembers(teamMembers); // Revert on error
        }
      });
    }
  };

  const handleRemoveMemberFromTeam = (userId: number) => {
    if (selectedTeamId) {
      const newMembers = teamMembers.filter(id => id !== userId);
      setTeamMembers(newMembers);
      updateWarTeam({ id: selectedTeamId, memberIds: newMembers }, {
        onSuccess: () => {
          toast({ title: "Updated", description: "Member removed from team" });
        },
        onError: () => {
          setTeamMembers(teamMembers); // Revert on error
        }
      });
    }
  };

  const filterTickets = (ticketsToFilter: any[]) => {
    return ticketsToFilter.filter(t => {
      // Admins et modos voient tous les tickets
      if (user.role === "admin" || user.role === "moderator") return true;
      
      // Tryouters ne voient que les tickets tryout
      if (user.role === "tryouter" && t.type === "tryout") return true;
      
      // War fighters ne voient que les tickets war
      if (user.role === "war_fighter" && t.type === "war_request") return true;
      
      return false;
    });
  };

  const pendingTickets = filterTickets(tickets?.filter(t => t.status !== "closed") || []);
  const closedTickets = filterTickets(tickets?.filter(t => t.status === "closed") || []);

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold font-display mb-8">Admin Panel</h1>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Open Tickets ({pendingTickets.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {user.role === "admin" && <TabsTrigger value="war-teams">War Teams</TabsTrigger>}
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingTickets.map(ticket => (
              <TicketAdminCard 
                key={ticket.id} 
                ticket={ticket} 
                onStatusChange={handleStatusChange}
                onChat={setSelectedTicket}
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
                onChat={setSelectedTicket}
              />
            ))}
          </TabsContent>

          {user.role === "admin" && (
            <TabsContent value="war-teams" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teams List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Teams</h3>
                  {teamsLoading ? (
                    <p>Loading teams...</p>
                  ) : (
                    teams?.map(team => (
                      <Card
                        key={team.id}
                        className={`cursor-pointer transition-all ${selectedTeamId === team.id ? "border-primary bg-primary/5" : "border-white/10"}`}
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-lg">Team {team.tier}</h4>
                              <p className="text-sm text-muted-foreground">{team.memberIds?.length || 0} members</p>
                            </div>
                            <Badge variant="outline">{team.tier}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Team Members Management */}
                {selectedTeamId && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Manage Members</h3>
                    
                    {usersLoading && (
                      <Card className="border-white/10 bg-secondary/30">
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Loading users...</p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Current Members */}
                    <Card className="border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base">Current Members ({teamMembers.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {usersLoading && teamMembers.length > 0 ? (
                          <p className="text-sm text-muted-foreground">Loading member details...</p>
                        ) : teamMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No members yet</p>
                        ) : (
                          teamMembers.map(memberId => {
                            const member = allUsers.find(u => u.id === memberId);
                            if (!member && allUsers.length === 0) {
                              return (
                                <div key={memberId} className="flex items-center justify-between bg-secondary/50 p-3 rounded border border-white/5">
                                  <span className="text-sm text-muted-foreground">User #{memberId} (loading...)</span>
                                </div>
                              );
                            }
                            return (
                              <div key={memberId} className="flex items-center justify-between bg-secondary/50 p-3 rounded border border-white/5 hover:border-white/10 transition">
                                <div className="flex items-center gap-3 flex-1">
                                  {member?.avatar && (
                                    <img src={member.avatar} alt={member.username} className="w-7 h-7 rounded-full flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{member?.username || `User #${memberId}`}</p>
                                    <p className="text-xs text-muted-foreground">{member?.role || 'unknown'}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-red-500/20 hover:text-red-400 flex-shrink-0 ml-2"
                                  onClick={() => handleRemoveMemberFromTeam(memberId)}
                                  disabled={usersLoading}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>

                    {/* Add Members - Autocomplete */}
                    <Card className="border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Members
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {usersLoading ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Loading users...</p>
                        ) : (
                          <>
                            {/* Search Input */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search users by name..."
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  setShowAddMenu(true);
                                }}
                                onFocus={() => setShowAddMenu(true)}
                                className="w-full pl-10 pr-4 py-2 rounded bg-secondary/50 border border-white/10 focus:border-primary outline-none transition text-sm"
                              />
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showAddMenu && (
                              <div className="border border-white/10 rounded bg-secondary/80 max-h-64 overflow-y-auto">
                                {allUsers
                                  .filter(u => {
                                    const notInTeam = !teamMembers.includes(u.id);
                                    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
                                    return notInTeam && matchesSearch;
                                  })
                                  .length === 0 ? (
                                  <div className="p-3 text-center text-sm text-muted-foreground">
                                    {searchQuery ? "No users found" : allUsers.length === 0 ? "No users available" : "All available users are in the team"}
                                  </div>
                                ) : (
                                  allUsers
                                    .filter(u => {
                                      const notInTeam = !teamMembers.includes(u.id);
                                      const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
                                      return notInTeam && matchesSearch;
                                    })
                                    .map(filterUser => (
                                      <button
                                        key={filterUser.id}
                                        onClick={() => {
                                          handleAddMemberToTeam(filterUser.id);
                                          setSearchQuery("");
                                          setShowAddMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition border-b border-white/5 last:border-b-0 text-left"
                                      >
                                        {filterUser.avatar && (
                                          <img src={filterUser.avatar} alt={filterUser.username} className="w-6 h-6 rounded-full" />
                                        )}
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{filterUser.username}</p>
                                          <p className="text-xs text-muted-foreground">{filterUser.role}</p>
                                        </div>
                                        <Plus className="w-4 h-4 text-primary" />
                                      </button>
                                    ))
                                )}
                              </div>
                            )}

                            {/* Quick Add Buttons - Available users without search */}
                            {!showAddMenu && searchQuery === "" && allUsers.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Quick add:</p>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                  {allUsers
                                    .filter(u => !teamMembers.includes(u.id) && u.role !== "guest")
                                    .slice(0, 8)
                                    .map(quickUser => (
                                      <Button
                                        key={quickUser.id}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddMemberToTeam(quickUser.id)}
                                        className="text-xs justify-start"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {quickUser.username}
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {selectedTicket && (
        <TicketChat ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}

function TicketAdminCard({ ticket, onStatusChange, onChat }: any) {
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
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => onChat(ticket)}>
            View Chat
          </Button>
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

import { useUser } from "@/hooks/use-auth";
import { useWarTeams, useUpdateWarTeam } from "@/hooks/use-war-team";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const TEAM_TIERS = ["Z", "Y", "X", "S", "A"] as const;
const TIER_COLORS = {
  Z: "bg-red-500/20 text-red-300 border-red-500/30",
  Y: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  X: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  S: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  A: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

interface UserData {
  id: number;
  username: string;
  role: string;
  avatar?: string;
}

export default function WarTeam() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: teams, isLoading: teamsLoading } = useWarTeams();
  const [usersData, setUsersData] = useState<Map<number, UserData>>(new Map());
  const [loadingUsers, setLoadingUsers] = useState(false);

  if (userLoading) return <div>Loading...</div>;
  if (!user) return <Redirect to="/" />;

  // Fetch all users data
  useEffect(() => {
    if (teams && teams.length > 0) {
      const allMemberIds = new Set<number>();
      teams.forEach(team => {
        team.memberIds?.forEach(id => allMemberIds.add(id));
      });

      if (allMemberIds.size > 0) {
        setLoadingUsers(true);
        apiFetch("/api/admin/users")
          .then(res => res.json())
          .then((users: UserData[]) => {
            const map = new Map<number, UserData>();
            users.forEach(u => map.set(u.id, u));
            setUsersData(map);
            setLoadingUsers(false);
          })
          .catch(err => {
            console.error("Failed to fetch users:", err);
            setLoadingUsers(false);
          });
      }
    }
  }, [teams]);

  // Create teams map for quick lookup
  const teamsMap = new Map(teams?.map(t => [t.tier, t]) || []);

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-display mb-2">War Teams</h1>
          <p className="text-muted-foreground text-lg">
            View the war teams and their members
          </p>
        </div>

        {teamsLoading ? (
          <div className="text-center py-20">Loading war teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {TEAM_TIERS.map((tier, index) => {
              const team = teamsMap.get(tier);
              const colorClass = TIER_COLORS[tier];

              return (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`border-2 transition-all hover:shadow-lg ${colorClass}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold font-display">
                          Team {tier}
                        </CardTitle>
                        <div className="text-2xl font-bold opacity-50">#{tier}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">
                          {team?.memberIds?.length || 0} members
                        </span>
                      </div>

                      {team && team.memberIds.length > 0 ? (
                        <div className="space-y-2">
                          {team.memberIds.map((memberId, memberIndex) => (
                            <MemberDisplay key={memberId} memberId={memberId} userData={usersData.get(memberId)} index={memberIndex} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic py-4 text-center">
                          No members yet
                        </div>
                      )}

                      {user.role === "war_fighter" && team?.memberIds?.includes(user.id) && (
                        <div className="pt-2 flex items-center gap-2 text-xs">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-yellow-400">You are in this team</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberDisplay({ memberId, userData, index }: { memberId: number; userData?: UserData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="text-sm px-2 py-1 rounded bg-white/5 border border-white/10 text-muted-foreground flex items-center gap-2 justify-between"
    >
      <span className="font-medium">{userData?.username || `User #${memberId}`}</span>
      {userData?.avatar && (
        <img src={userData.avatar} alt={userData.username} className="w-5 h-5 rounded-full" />
      )}
    </motion.div>
  );
}

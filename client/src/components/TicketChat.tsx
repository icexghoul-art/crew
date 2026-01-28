import { useState, useRef, useEffect } from "react";
import { useUser } from "@/hooks/use-auth";
import { useTicketWithMessages } from "@/hooks/use-ticket-detail";
import { useAddTicketMessage } from "@/hooks/use-tickets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  content: string;
  createdAt: Date;
  sender?: {
    id: number;
    username: string;
    avatar: string;
    role: string;
  };
}

interface Ticket {
  id: number;
  type: "tryout" | "war_request";
  status: string;
  creatorId: number;
  content: string;
  createdAt: Date;
  messages?: TicketMessage[];
}

interface TicketChatProps {
  ticket: Ticket;
  onClose: () => void;
}

export function TicketChat({ ticket, onClose }: TicketChatProps) {
  const { data: user } = useUser();
  const { toast } = useToast();
  const { data: ticketData, refetch } = useTicketWithMessages(ticket.id);
  const { mutate: addMessage } = useAddTicketMessage();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages quand le ticket est chargé
  useEffect(() => {
    if (ticketData?.messages) {
      setMessages(ticketData.messages);
    } else if (ticket.messages) {
      setMessages(ticket.messages);
    }
  }, [ticketData, ticket.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRoleBadge = (role: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <span className="text-xs bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold ml-1">
          Creator
        </span>
      );
    }
    switch (role) {
      case "admin":
        return (
          <span className="text-xs bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold ml-1">
            Admin
          </span>
        );
      case "moderator":
        return (
          <span className="text-xs bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold ml-1">
            Mod
          </span>
        );
      case "war_fighter":
        return (
          <span className="text-xs bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold ml-1">
            War
          </span>
        );
      case "tryouter":
        return (
          <span className="text-xs bg-primary/30 text-primary px-1.5 py-0.5 rounded font-semibold ml-1">
            Tryout
          </span>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !message.trim()) return;

    setLoading(true);
    addMessage(
      { ticketId: ticket.id, content: message },
      {
        onSuccess: () => {
          setMessage("");
          // Rafraîchir les messages après succès
          refetch();
          toast({
            title: "Success",
            description: "Message sent!",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to send message",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-secondary border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b border-white/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-display text-xl">Ticket #{ticket.id}</CardTitle>
              <Badge variant="outline" className="mt-2 capitalize">
                {ticket.type.replace('_', ' ')}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 border border-white/5">
            <p className="text-sm font-semibold text-primary mb-2">Original Request</p>
            <p className="text-sm text-muted-foreground">{ticket.content}</p>
          </div>

          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 ${msg.senderId === user?.id ? "text-right" : ""}`}
                >
                  {msg.sender && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      <span className="text-foreground">{msg.sender.username}</span>
                      {msg.senderId === ticket.creatorId && (
                        <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          Creator
                        </span>
                      )}
                      {msg.sender.role === "admin" && (
                        <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                      {msg.sender.role === "moderator" && (
                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded">
                          Mod
                        </span>
                      )}
                    </p>
                  )}
                  <div
                    className={`inline-block max-w-sm px-3 py-2 rounded-lg text-sm break-words border ${
                      msg.senderId === user?.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-foreground border-secondary/60"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <div className="border-t border-white/10 p-4 space-y-3">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="resize-none bg-background/50 border-white/10 min-h-[80px]"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

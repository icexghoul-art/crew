import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema, type InsertTicket } from "@shared/schema";
import { useCreateTicket } from "@/hooks/use-tickets";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TicketPlus } from "lucide-react";
import { useUser } from "@/hooks/use-auth";

export function TicketModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateTicket();
  const { toast } = useToast();
  const { data: user } = useUser();

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      type: "tryout",
      content: "",
      status: "open",
      creatorId: user?.id || 0, // This will be validated on backend anyway
    },
  });

  const onSubmit = (data: InsertTicket) => {
    if (!user) return;
    
    mutate({ ...data, creatorId: user.id }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({
          title: "Ticket Created",
          description: "Your request has been submitted to the admins.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
          <TicketPlus className="w-4 h-4" />
          Create Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-secondary border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide text-xl">New Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-secondary border-white/10">
                      <SelectItem value="tryout">Tryout Request</SelectItem>
                      <SelectItem value="war_request">War Request</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide your level, fruits, availability, or war terms..." 
                      className="resize-none bg-background/50 border-white/10 min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={isPending}
            >
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

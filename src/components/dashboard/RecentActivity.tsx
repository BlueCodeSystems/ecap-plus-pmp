import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Plus, Trash2, StickyNote, Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const RecentActivity = () => {
  const { user } = useAuth();
  const district = user?.location ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const [action, setAction] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState("note");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["directus-activities"],
    queryFn: async () => {
      const { getActivities } = await import("@/lib/directus");
      return getActivities();
    },
    refetchInterval: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { action: string; details: string; related_collection?: string }) => {
      const { createActivity } = await import("@/lib/directus");
      return createActivity(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus-activities"] });
      toast({ title: "Activity Added", description: "Your note has been saved." });
      setIsOpen(false);
      setAction("");
      setDetails("");
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not save activity." });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteActivity } = await import("@/lib/directus");
      return deleteActivity(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus-activities"] });
      toast({ title: "Deleted", description: "Activity log removed." });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;
    createMutation.mutate({
      action,
      details,
      related_collection: type
    });
  };

  return (
    <GlowCard>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Activity & Notes</CardTitle>
          <CardDescription>Team updates and system logs</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Note</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Activity Note</DialogTitle>
              <DialogDescription>
                Manually add a log entry or note for the team.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">General Note</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="alert">Critical Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="action">Subject / Action</Label>
                <Input
                  id="action"
                  placeholder="e.g. Weekly Review Completed"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  placeholder="Optional details..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Activity
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading activities...
          </div>
        ) : activities?.length === 0 ? (
          <div className="flex h-[350px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
            <ActivityIcon className="h-8 w-8 mb-2 opacity-50" />
            No activity records found.
            <Button variant="link" onClick={() => setIsOpen(true)} className="mt-2 text-xs">
              create the first entry
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              {activities?.map((item: any, i: number) => {
                const isNote = item.related_collection === 'note';
                const isAlert = item.related_collection === 'alert';
                const creatorName = item.user_created ?
                  (typeof item.user_created === 'object' ? `${item.user_created.first_name || ''} ${item.user_created.last_name || ''}` : 'User')
                  : 'System';

                return (
                  <div key={`${item.id}-${i}`} className="group relative flex items-start gap-4 text-sm animate-in fade-in duration-500 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                    <Avatar className={`h-8 w-8 mt-1 border ${isAlert ? "border-red-200" : ""}`}>
                      {isNote || isAlert ? (
                        <AvatarFallback className={isAlert ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}>
                          <StickyNote className="h-4 w-4" />
                        </AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${creatorName}`} />
                          <AvatarFallback>{creatorName[0]}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="grid gap-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-foreground leading-tight">
                          {item.action}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {item.date_created ? formatDistanceToNow(new Date(item.date_created), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[13px] line-clamp-2">
                        {item.details || "No details provided."}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                        <span>by {creatorName}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </GlowCard>
  );
};

export default RecentActivity;

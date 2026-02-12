import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlowCard from "@/components/aceternity/GlowCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { Search, Trash2, RotateCcw, UserX, UserPlus, Shield, Mail, Calendar } from "lucide-react";
import {
  deleteUser,
  listRoles,
  listUsers,
  updateUser,
  type DirectusRole,
  type DirectusUser,
} from "@/lib/directus";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

const Users = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [userToTrash, setUserToTrash] = useState<string | null>(null);
  const [userToWipe, setUserToWipe] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["directus", "users"],
    queryFn: () => listUsers(),
  });

  const rolesQuery = useQuery({
    queryKey: ["directus", "roles"],
    queryFn: listRoles,
  });

  const rolesById = useMemo(() => {
    const entries: [string, string][] = (rolesQuery.data ?? []).map((role: DirectusRole) => [
      role.id,
      role.name,
    ]);
    return new Map<string, string>(entries);
  }, [rolesQuery.data]);

  const softDeleteMutation = useMutation({
    mutationFn: (id: string) => updateUser(id, { status: "suspended" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      toast.success("User moved to trash");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to move user to trash");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => updateUser(id, { status: "active" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      toast.success("User restored successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to restore user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      toast.success("User deleted permanently");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    },
  });

  const filteredUsers = useMemo(() => {
    return (usersQuery.data ?? []).filter((user: DirectusUser) => {
      const statusMatch = activeTab === "active"
        ? user.status === "active" || !user.status
        : user.status === "suspended";

      if (!statusMatch) return false;

      const searchLower = searchQuery.toLowerCase();
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase();
      return (
        fullName.includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [usersQuery.data, searchQuery, activeTab]);

  const activeCount = (usersQuery.data ?? []).filter(u => u.status === "active" || !u.status).length;
  const trashCount = (usersQuery.data ?? []).filter(u => u.status === "suspended").length;

  return (
    <DashboardLayout subtitle="User Management">
      <PageIntro
        eyebrow="User Management"
        title="Manage access with confidence."
        description="Create Directus accounts, assign roles, and monitor platform access."
        actions={
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              {activeCount} Active
            </Badge>
            {trashCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {trashCount} in Trash
              </Badge>
            )}
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2"
              onClick={() => navigate("/users/new")}
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-slate-100/50 p-1">
            <TabsTrigger value="active" className="px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Active Users
            </TabsTrigger>
            <TabsTrigger value="trash" className="px-6 data-[state=active]:bg-white data-[state=active]:text-slate-900">
              Recycle Bin
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search users..."
            className="pl-10 bg-white/50 border-slate-200 focus:border-slate-300 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <GlowCard>
        <div className="p-0">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100/50">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              {activeTab === "active" ? <Shield className="h-5 w-5 text-emerald-500" /> : <Trash2 className="h-5 w-5 text-amber-500" />}
              {activeTab === "active" ? "Active Directory" : "Recycle Bin"}
            </h2>
            {usersQuery.isLoading && <LoadingDots className="text-slate-400" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-6 font-semibold border-r border-slate-200">User Details</th>
                  <th className="py-3 px-6 font-semibold border-r border-slate-200">Role & Permissions</th>
                  <th className="py-3 px-6 font-semibold border-r border-slate-200">Status</th>
                  <th className="py-3 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {usersQuery.isLoading && (
                  <tr>
                    <td className="p-0" colSpan={4}>
                      <TableSkeleton rows={5} columns={4} />
                    </td>
                  </tr>
                )}
                {!usersQuery.isLoading && filteredUsers.length === 0 && (
                  <tr>
                    <td className="py-12 text-center text-slate-500" colSpan={4}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserX className="h-8 w-8 text-slate-300" />
                        <p className="text-slate-500 font-medium">
                          {searchQuery ? "No matching users found." : activeTab === "active" ? "No active users found." : "Trash is empty."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user: DirectusUser) => (
                  <tr key={user.id} className="group transition-all hover:bg-slate-50/80">
                    <td className="py-4 px-6 border-r border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 capitalize">
                          {typeof user.role === "string"
                            ? rolesById.get(user.role as string) ?? user.role
                            : user.role?.name ?? "No Role"}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <Badge className={cn(
                        "capitalize shadow-none",
                        (user.status === "active" || !user.status) ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      )}>
                        {user.status ?? "active"}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeTab === "active" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-slate-200 hover:bg-slate-100"
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => setUserToTrash(user.id)}
                              disabled={softDeleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 flex items-center gap-1"
                              onClick={() => restoreMutation.mutate(user.id)}
                              disabled={restoreMutation.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                              onClick={() => setUserToWipe(user.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Wipe
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>

      <ConfirmDialog
        isOpen={!!userToTrash}
        onClose={() => setUserToTrash(null)}
        onConfirm={() => {
          if (userToTrash) softDeleteMutation.mutate(userToTrash);
          setUserToTrash(null);
        }}
        title="Move User to Trash?"
        description="This user will be suspended and unable to log in. You can restore them later."
        confirmText="Move to Trash"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={!!userToWipe}
        onClose={() => setUserToWipe(null)}
        onConfirm={() => {
          if (userToWipe) deleteMutation.mutate(userToWipe);
          setUserToWipe(null);
        }}
        title="Permanently Delete User?"
        description="This action is irreversible. All data associated with this user account will be permanently removed."
        confirmText="Wipe Permanently"
        variant="destructive"
      />
    </DashboardLayout>
  );
};

export default Users;

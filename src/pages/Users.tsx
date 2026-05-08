import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlowCard from "@/components/aceternity/GlowCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Activity, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingDots from "@/components/aceternity/LoadingDots";

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
import { useAuth } from "@/context/AuthContext";

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

  const { user: currentUser } = useAuth();

  const filteredUsers = useMemo(() => {
    return (usersQuery.data ?? []).filter((user: DirectusUser) => {
      // Visibility Logic
      if (currentUser) {
        // Resolve current user's role name
        let myRoleName = "User";
        if (typeof currentUser.role === "string") {
          myRoleName = rolesById.get(currentUser.role) || "User";
        } else if (currentUser.role?.name) {
          myRoleName = currentUser.role.name;
        }

        // Get target user's role name
        let targetRoleName = "User";
        if (typeof user.role === "string") {
          targetRoleName = rolesById.get(user.role) || "User";
        } else if (user.role?.name) {
          targetRoleName = user.role.name;
        }

        const isMyRoleSupport = myRoleName.toLowerCase().includes("support"); // ECAP+ Support or ECAP II Support
        const isTargetAdmin = targetRoleName === "Administrator"; // Directus Admin
        const isTargetEcapII = targetRoleName.toLowerCase().includes("ecap ii") || targetRoleName.toLowerCase().includes("ecapii");

        // Universal Rule: Standard Users & Support cannot see Directus Admins
        if (myRoleName !== "Administrator" && isTargetAdmin) return false;

        // Rule 1: ECAP+ Users (Standard)
        // Can NOT see ECAP II Support
        // (Directus Admin already hidden above)
        if (!isMyRoleSupport && myRoleName !== "Administrator") {
          if (isTargetEcapII) return false;
        }

        // Rule 2: Support Users (ECAP+ Support)
        // Can see everyone (implied by skipping the above block if isMyRoleSupport)

        // Rule 3: Directus Admin
        // Can see everyone (implied by skipping if myRoleName === "Administrator")
      }

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
  }, [usersQuery.data, searchQuery, activeTab, currentUser, rolesById]);

  const activeCount = (usersQuery.data ?? []).filter(u => u.status === "active" || !u.status).length;
  const trashCount = (usersQuery.data ?? []).filter(u => u.status === "suspended").length;

  const dateStr = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const totalUserCount = activeCount + trashCount;

  return (
    <DashboardLayout subtitle="User Management">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-[0_30px_80px_-50px_rgba(15,118,110,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(16,185,129,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_30%,rgba(14,165,233,0.15),transparent_45%)]" />
        <div className="pointer-events-none absolute -top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-emerald-300/40 blur-[110px] animate-pulse [animation-duration:6s]" />
        <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-sky-300/30 blur-[120px] animate-pulse [animation-duration:8s] [animation-delay:-3s]" />

        <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">User management</span>
              <span className="text-slate-400 text-[11px]">·</span>
              <span className="text-[11px] text-slate-600">{dateStr}</span>
              <Badge variant="outline" className="ml-1 gap-1 border-emerald-200 bg-emerald-50/80 text-[10px] text-emerald-700">
                <Activity className="h-3 w-3" /> {totalUserCount.toLocaleString()} users
              </Badge>
              {trashCount > 0 && (
                <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50/80 text-[10px] text-amber-700">
                  <Trash2 className="h-3 w-3" /> {trashCount} in trash
                </Badge>
              )}
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-sky-700 bg-clip-text text-transparent">
                Manage access with confidence
              </span>
              <Badge variant="outline" className="ml-2 gap-1 border-emerald-200 bg-white/70 align-middle text-[10px] text-emerald-700 shadow-sm">
                <Sparkles className="h-3 w-3" /> Roles · Districts · Provinces
              </Badge>
            </h1>
            <p className="mt-1 text-xs text-slate-600">Create Directus accounts, assign roles, and monitor platform access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="Search users…"
                className="h-9 w-56 pl-9 bg-white/80 border-slate-200 backdrop-blur-md text-xs focus-visible:ring-emerald-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => navigate("/users/new")}
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-700/20 transition-all hover:from-emerald-700 hover:to-teal-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-100/80 p-1 backdrop-blur-sm border border-slate-200/50">
            <TabsTrigger value="active" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
              Active
            </TabsTrigger>
            <TabsTrigger value="trash" className="h-7 px-4 rounded-lg text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm">
              Archived
              {trashCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-100 px-1 text-[10px] font-bold text-rose-700">{trashCount}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search users…"
            className="pl-9 h-10 bg-white border-slate-200 focus-visible:ring-emerald-500/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-br from-emerald-200/40 via-teal-200/25 to-sky-200/20 opacity-50 blur-md" />
        <GlowCard>
        <div className="p-0">
          <div className="px-6 py-4 flex items-center justify-between border-b border-emerald-100/40 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-transparent">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-800">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-white/60 shadow-sm",
                activeTab === "active"
                  ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700"
                  : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700"
              )}>
                {activeTab === "active" ? <Shield className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              </div>
              {activeTab === "active" ? "Active directory" : "Recycle bin"}
            </h2>
            {usersQuery.isLoading && <LoadingDots className="text-emerald-500" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-sky-50/40 text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                <tr className="border-b border-emerald-100/60">
                  <th className="py-3 px-6">User details</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Province</th>
                  <th className="py-3 px-6">District</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {usersQuery.isLoading && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex items-center justify-center py-12">
                        <LoadingDots />
                      </div>
                    </td>
                  </tr>
                )}
                {!usersQuery.isLoading && filteredUsers.length === 0 && (
                  <tr>
                    <td className="py-12 text-center text-slate-500" colSpan={5}>
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
                  <tr key={user.id} className="group transition-colors border-b border-emerald-50/60 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:via-teal-50/20 hover:to-transparent">
                    <td className="py-4 px-6 border-r border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed user"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 capitalize">
                        {user.description || "Administrator"}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <span className="text-sm text-slate-700">{user.title || "All"}</span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-200">
                      <span className="text-sm text-slate-700">{user.location || "All"}</span>
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
      </div>

      <ConfirmDialog
        isOpen={!!userToTrash}
        onClose={() => setUserToTrash(null)}
        onConfirm={() => {
          if (userToTrash) softDeleteMutation.mutate(userToTrash);
          setUserToTrash(null);
        }}
        title="Move user to trash?"
        description="This user will be suspended and unable to log in. You can restore them later."
        confirmText="Move to trash"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={!!userToWipe}
        onClose={() => setUserToWipe(null)}
        onConfirm={() => {
          if (userToWipe) deleteMutation.mutate(userToWipe);
          setUserToWipe(null);
        }}
        title="Permanently delete user?"
        description="This action is irreversible. All data associated with this user account will be permanently removed."
        confirmText="Wipe permanently"
        variant="destructive"
      />
    </DashboardLayout>
  );
};

export default Users;

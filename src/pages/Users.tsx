import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlowCard from "@/components/aceternity/GlowCard";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  deleteUser,
  listRoles,
  listUsers,
  type DirectusRole,
  type DirectusUser,
} from "@/lib/directus";
import { useNavigate } from "react-router-dom";

const Users = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const usersQuery = useQuery({
    queryKey: ["directus", "users"],
    queryFn: listUsers,
  });

  const rolesQuery = useQuery({
    queryKey: ["directus", "roles"],
    queryFn: listRoles,
  });

  const rolesById = useMemo(() => {
    const entries = (rolesQuery.data ?? []).map((role: DirectusRole) => [
      role.id,
      role.name,
    ]);
    return new Map(entries);
  }, [rolesQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
    },
  });

  const activeCount = usersQuery.data?.length ?? 0;

  return (
    <DashboardLayout subtitle="User Management">
      <PageIntro
        eyebrow="User Management"
        title="Manage access with confidence."
        description="Create Directus accounts, assign roles, and monitor platform access."
        actions={
          <>
            <Badge className="bg-emerald-100 text-emerald-700">
              {activeCount} Active Users
            </Badge>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => navigate("/users/new")}
            >
              Add User
            </Button>
          </>
        }
      />

      <GlowCard>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
            {usersQuery.isLoading && <LoadingDots className="text-slate-400" />}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {usersQuery.isLoading && (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={5}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading users</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </td>
                  </tr>
                )}
                {(usersQuery.data ?? []).map((user: DirectusUser) => (
                  <tr key={user.id} className="transition-colors hover:bg-amber-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {[user.first_name, user.last_name].filter(Boolean).join(" ") || "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{user.email}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {typeof user.role === "string"
                        ? rolesById.get(user.role) ?? user.role
                        : user.role?.name ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {user.status ?? "active"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200"
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm("Delete this user?")) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!usersQuery.isLoading && usersQuery.data?.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>
    </DashboardLayout>
  );
};

export default Users;

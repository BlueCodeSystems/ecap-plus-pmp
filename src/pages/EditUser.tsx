import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  deleteUser,
  getUser,
  listRoles,
  updateUser,
  type DirectusRole,
} from "@/lib/directus";
import { useNavigate, useParams } from "react-router-dom";

type UserFormState = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  password: string;
};

const EditUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formState, setFormState] = useState<UserFormState>({
    email: "",
    first_name: "",
    last_name: "",
    role: "",
    status: "active",
    password: "",
  });

  const rolesQuery = useQuery({
    queryKey: ["directus", "roles"],
    queryFn: listRoles,
  });

  const userQuery = useQuery({
    queryKey: ["directus", "user", id],
    queryFn: () => getUser(id ?? ""),
    enabled: Boolean(id),
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      const roleId = typeof data.role === "string" ? data.role : data.role?.id ?? "";
      setFormState({
        email: data.email ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        role: roleId,
        status: data.status ?? "active",
        password: "",
      });
    },
  });

  const rolesById = useMemo(() => {
    const entries = (rolesQuery.data ?? []).map((role: DirectusRole) => [
      role.id,
      role.name,
    ]);
    return new Map(entries);
  }, [rolesQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserFormState>) => updateUser(id ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      queryClient.invalidateQueries({ queryKey: ["directus", "user", id] });
      navigate("/users");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(id ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      navigate("/users");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.email.trim()) {
      return;
    }

    const payload: Partial<UserFormState> = {
      email: formState.email.trim(),
      first_name: formState.first_name.trim() || undefined,
      last_name: formState.last_name.trim() || undefined,
      role: formState.role || undefined,
      status: formState.status || undefined,
    };

    if (formState.password.trim()) {
      payload.password = formState.password.trim();
    }

    updateMutation.mutate(payload);
  };

  const roleLabel = formState.role ? rolesById.get(formState.role) ?? formState.role : "Unassigned";

  return (
    <DashboardLayout subtitle="Edit User">
      <PageIntro
        eyebrow="User Management"
        title="Edit Directus account."
        description="Update profile details, adjust access, and manage credentials."
        actions={
          <Badge className="bg-amber-100 text-amber-700">{roleLabel}</Badge>
        }
      />

      <GlowCard className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Edit User</h2>
            <Button type="button" variant="outline" onClick={() => navigate("/users")}>
              Back to Users
            </Button>
          </div>

          {userQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Loading user <LoadingDots className="text-slate-400" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Email"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, email: event.target.value }))
              }
              required
              className="sm:col-span-2"
            />
            <Input
              placeholder="First name"
              value={formState.first_name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, first_name: event.target.value }))
              }
            />
            <Input
              placeholder="Last name"
              value={formState.last_name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, last_name: event.target.value }))
              }
            />
            <Input
              placeholder="Role ID"
              value={formState.role}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, role: event.target.value }))
              }
              list="directus-roles"
            />
            <datalist id="directus-roles">
              {(rolesQuery.data ?? []).map((role: DirectusRole) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </datalist>
            <Select
              value={formState.status}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-10 border-slate-200 bg-white/90 text-sm text-slate-700">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="New password (optional)"
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={updateMutation.isPending || userQuery.isLoading}>
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  Saving <LoadingDots />
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (window.confirm("Delete this user?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Delete User
            </Button>
          </div>

          {(updateMutation.error || deleteMutation.error) && (
            <p className="text-sm text-destructive">
              {(updateMutation.error as Error)?.message ||
                (deleteMutation.error as Error)?.message}
            </p>
          )}
        </form>
      </GlowCard>
    </DashboardLayout>
  );
};

export default EditUser;

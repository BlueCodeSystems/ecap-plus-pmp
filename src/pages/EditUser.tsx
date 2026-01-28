import { useMemo, useState, useEffect } from "react";
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
import { toast } from "sonner";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: ["directus", "roles"],
    queryFn: listRoles,
  });

  const userQuery = useQuery({
    queryKey: ["directus", "user", id],
    queryFn: () => getUser(id ?? ""),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (userQuery.data) {
      const data = userQuery.data;
      const roleId = typeof data.role === "string" ? data.role : data.role?.id ?? "";
      setFormState({
        email: data.email ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        role: roleId,
        status: data.status ?? "active",
        password: "",
      });
    }
  }, [userQuery.data]);

  const rolesById = useMemo(() => {
    const entries: [string, string][] = (rolesQuery.data ?? []).map((role: DirectusRole) => [
      role.id,
      role.name,
    ]);
    return new Map<string, string>(entries);
  }, [rolesQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserFormState>) => updateUser(id ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      queryClient.invalidateQueries({ queryKey: ["directus", "user", id] });
      toast.success("User updated successfully");
      navigate("/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    },
  });

  const trashMutation = useMutation({
    mutationFn: () => updateUser(id ?? "", { status: "suspended" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      toast.success("User moved to trash");
      navigate("/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to move user to trash");
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

  const roleLabel = formState.role ? (rolesById.get(formState.role) ?? formState.role) : "Unassigned";

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
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select
                value={formState.role}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="h-10 border-slate-200 bg-white/90 text-sm text-slate-700">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(rolesQuery.data ?? []).map((role: DirectusRole) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Account Status</label>
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
            </div>
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
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 font-medium"
              onClick={() => setIsConfirmOpen(true)}
              disabled={trashMutation.isPending}
            >
              Move to Trash
            </Button>
          </div>

          {(updateMutation.error || trashMutation.error) && (
            <p className="text-sm text-destructive">
              {(updateMutation.error as Error)?.message ||
                (trashMutation.error as Error)?.message}
            </p>
          )}
        </form>
      </GlowCard>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          trashMutation.mutate();
          setIsConfirmOpen(false);
        }}
        title="Move User to Trash?"
        description="This user will be suspended and unable to log in. You can restore them later from the Recycle Bin."
        confirmText="Move to Trash"
        variant="destructive"
      />
    </DashboardLayout>
  );
};

export default EditUser;

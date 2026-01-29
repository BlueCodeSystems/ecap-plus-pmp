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
import { createUser, listRoles, type DirectusRole } from "@/lib/directus";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

type UserFormState = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  password: string;
};

const emptyForm: UserFormState = {
  email: "",
  first_name: "",
  last_name: "",
  role: "",
  status: "active",
  password: "",
};

const AddUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<UserFormState>(emptyForm);

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

  // Auto-select ECAP+ role
  useEffect(() => {
    if (rolesQuery.data) {
      const ecapRole = rolesQuery.data.find(
        (r: DirectusRole) => r.name.toLowerCase().includes("ecap+")
      );
      if (ecapRole) {
        setFormState((prev) => ({ ...prev, role: ecapRole.id }));
      }
    }
  }, [rolesQuery.data]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["directus", "users"] });
      toast.success("User created successfully");
      navigate("/users");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formState.email.trim() || !formState.password.trim()) {
      return;
    }

    createMutation.mutate({
      email: formState.email.trim(),
      first_name: formState.first_name.trim() || undefined,
      last_name: formState.last_name.trim() || undefined,
      role: formState.role || undefined,
      status: formState.status || undefined,
      password: formState.password.trim(),
    });
  };

  return (
    <DashboardLayout subtitle="Add User">
      <PageIntro
        eyebrow="User Management"
        title="Add a new Directus account."
        description="Create a secure login and assign the correct access level for program reporting."
        actions={
          <Badge className="bg-emerald-100 text-emerald-700">New User</Badge>
        }
      />

      <GlowCard className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
            <Button type="button" variant="outline" onClick={() => navigate("/users")}>
              Cancel
            </Button>
          </div>

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
            {/* Role is auto-assigned to ECAP+ in the background */}
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
              placeholder="Password"
              type="password"
              value={formState.password}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  Creating <LoadingDots />
                </span>
              ) : (
                "Create User"
              )}
            </Button>
          </div>

          {createMutation.error && (
            <p className="text-sm text-destructive">
              {(createMutation.error as Error)?.message}
            </p>
          )}
          {rolesQuery.isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Loading roles <LoadingDots className="text-slate-400" />
            </div>
          )}
        </form>
      </GlowCard>
    </DashboardLayout>
  );
};

export default AddUser;

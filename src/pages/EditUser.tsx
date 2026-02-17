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
import { getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

type UserFormState = {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
  custom_role: string;
  province: string;
  district: string;
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
    password: "",
    custom_role: "",
    province: "",
    district: "",
  });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // --- Discovery Logic for Provinces and Districts ---
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", "All"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 60,
  });

  const { provinces, districtsByProvince } = useMemo(() => {
    const mapping = new Map<string, Set<string>>();

    if (householdsListQuery.data) {
      householdsListQuery.data.forEach((h: any) => {
        const prov = h.province;
        const dist = h.district;
        if (prov) {
          if (!mapping.has(prov)) {
            mapping.set(prov, new Set());
          }
          if (dist) {
            mapping.get(prov)?.add(dist);
          }
        }
      });
    }

    const sortedProvinces = Array.from(mapping.keys()).sort();
    const sortedMapping: Record<string, string[]> = {};

    sortedProvinces.forEach(p => {
      sortedMapping[p] = Array.from(mapping.get(p)!).sort();
    });

    return {
      provinces: sortedProvinces,
      districtsByProvince: sortedMapping,
    };
  }, [householdsListQuery.data]);

  const availableDistricts = useMemo(() => {
    if (!formState.province) return [];
    return districtsByProvince[formState.province] || [];
  }, [formState.province, districtsByProvince]);

  const rolesQuery = useQuery({
    queryKey: ["directus", "roles"],
    queryFn: listRoles,
  });

  // Identify ECAP+ User and Support role IDs
  const [ecapUserRoleId, setEcapUserRoleId] = useState<string>("");
  const [ecapSupportRoleId, setEcapSupportRoleId] = useState<string>("");

  useEffect(() => {
    if (rolesQuery.data) {
      const ecapRole = rolesQuery.data.find(
        (r: DirectusRole) => r.name.toLowerCase().includes("ecap+") && !r.name.toLowerCase().includes("support")
      );
      const supportRole = rolesQuery.data.find(
        (r: DirectusRole) => r.name.toLowerCase().includes("ecap+") && r.name.toLowerCase().includes("support")
      );

      if (ecapRole) setEcapUserRoleId(ecapRole.id);
      if (supportRole) setEcapSupportRoleId(supportRole.id);
    }
  }, [rolesQuery.data]);

  const userQuery = useQuery({
    queryKey: ["directus", "user", id],
    queryFn: () => getUser(id ?? ""),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (userQuery.data) {
      const data = userQuery.data;
      const roleId = typeof data.role === "string" ? data.role : data.role?.id ?? "";

      // Determine the best initial role/province/district from loaded data
      let pseudoRole = data.description || "";

      // Map "ECAP+ Support" description to "Support User" pseudo-role
      if (pseudoRole === "ECAP+ Support") {
        pseudoRole = "Support User";
      }

      let prov = data.title || "";
      if (prov === "All") prov = "";

      let dist = data.location || "";
      if (dist === "All") dist = "";

      setFormState({
        email: data.email ?? "",
        first_name: data.first_name ?? "",
        last_name: data.last_name ?? "",
        role: roleId,
        password: "",
        custom_role: pseudoRole,
        province: prov,
        district: dist,
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
    mutationFn: (payload: Partial<UserFormState> & { description?: string, title?: string, location?: string }) => updateUser(id ?? "", payload),
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

    // Determine title (Province) and location (District) based on Custom Role
    let title = "All";
    let location = "All";
    let description = formState.custom_role;
    let finalRoleId = ecapUserRoleId || formState.role; // Default to ECAP+ User or current

    if (formState.custom_role === "Provincial User") {
      title = formState.province || "All";
      location = "All";
    } else if (formState.custom_role === "District User") {
      title = formState.province || "All";
      location = formState.district || "All";
    } else if (formState.custom_role === "Support User") {
      title = "All";
      location = "All";
      description = "ECAP+ Support";
      finalRoleId = ecapSupportRoleId || formState.role;
    }

    const payload: any = {
      email: formState.email.trim(),
      first_name: formState.first_name.trim() || undefined,
      last_name: formState.last_name.trim() || undefined,
      role: finalRoleId || undefined,
      description: description || undefined,
      title: title,
      location: location,
    };

    if (formState.password.trim()) {
      payload.password = formState.password.trim();
    }

    updateMutation.mutate(payload);
  };

  const roleLabel = formState.custom_role || "Unassigned Role";

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
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <Select
                value={formState.custom_role}
                onValueChange={(value) => {
                  setFormState((prev) => ({
                    ...prev,
                    custom_role: value,
                    // Reset subordinate fields on role change
                    province: (value === "Administrator" || value === "Support User") ? "" : prev.province,
                    district: (value === "Administrator" || value === "Provincial User" || value === "Support User") ? "" : prev.district
                  }));
                }}
              >
                <SelectTrigger className="h-10 border-slate-200 bg-white/90 text-sm text-slate-700">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Provincial User">Provincial User</SelectItem>
                  <SelectItem value="District User">District User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Province Selector */}
            {(formState.custom_role === "Provincial User" || formState.custom_role === "District User") && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Province</label>
                <Select
                  value={formState.province}
                  onValueChange={(value) => setFormState((prev) => ({
                    ...prev,
                    province: value,
                    district: "" // Reset district when province changes
                  }))}
                  disabled={householdsListQuery.isLoading}
                >
                  <SelectTrigger className="h-10 border-slate-200 bg-white/90 text-sm text-slate-700">
                    <SelectValue placeholder={householdsListQuery.isLoading ? "Loading..." : "Select province"} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* District Selector */}
            {formState.custom_role === "District User" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">District</label>
                <Select
                  value={formState.district}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, district: value }))}
                  disabled={householdsListQuery.isLoading || !formState.province}
                >
                  <SelectTrigger className="h-10 border-slate-200 bg-white/90 text-sm text-slate-700">
                    <SelectValue placeholder={
                      householdsListQuery.isLoading ? "Loading..." :
                        !formState.province ? "Select a province first" : "Select district"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDistricts.length === 0 ? (
                      <SelectItem value="no-districts" disabled>No districts found</SelectItem>
                    ) : (
                      availableDistricts.map((dist) => (
                        <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status management is handled via list actions (suspend/restore) */}

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
        description="This user will be suspended and unable to log in. You can restore them later from the Archived Users tab."
        confirmText="Move to Trash"
        variant="destructive"
      />
    </DashboardLayout>
  );
};

export default EditUser;

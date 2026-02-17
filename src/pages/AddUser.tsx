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
import { createUser, listRoles, type DirectusRole } from "@/lib/directus";
import { getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const emptyForm: UserFormState = {
  email: "",
  first_name: "",
  last_name: "",
  role: "",
  password: "",
  custom_role: "",
  province: "",
  district: "",
};

const AddUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [formState, setFormState] = useState<UserFormState>(emptyForm);

  // --- Discovery Logic for Provinces and Districts ---
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", "All"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
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

  const rolesById = useMemo(() => {
    const entries: [string, string][] = (rolesQuery.data ?? []).map((role: DirectusRole) => [
      role.id,
      role.name,
    ]);
    return new Map<string, string>(entries);
  }, [rolesQuery.data]);

  // Auto-select ECAP+ roles
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

      // Default to ECAP+ User role initially if available
      if (ecapRole && !formState.role) {
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

    // Determine title (Province) and location (District) based on Custom Role
    let title = "All";
    let location = "All";
    let description = formState.custom_role;
    let finalRoleId = ecapUserRoleId; // Default to ECAP+ User

    if (formState.custom_role === "Provincial User") {
      title = formState.province || "All";
      location = "All";
    } else if (formState.custom_role === "District User") {
      title = formState.province || "All";
      location = formState.district || "All";
    } else if (formState.custom_role === "Support User") {
      // Support User: Mapped to "ECAP+ Support" role, Location is All
      title = "All";
      location = "All";
      description = "ECAP+ Support";
      finalRoleId = ecapSupportRoleId || formState.role; // Use Support Role ID if found
    }

    createMutation.mutate({
      email: formState.email.trim(),
      first_name: formState.first_name.trim() || undefined,
      last_name: formState.last_name.trim() || undefined,
      role: finalRoleId || undefined,
      status: "active",
      password: formState.password.trim(),
      // Map custom fields to Directus fields
      description: description || undefined,
      title: title,
      location: location,
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

            {/* Custom Role Selector */}
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
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Provincial User">Provincial User</SelectItem>
                  <SelectItem value="District User">District User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Province Selector - Visible for Provincial and District Users */}
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

            {/* District Selector - Visible only for District Users */}
            {formState.custom_role === "District User" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">District</label>
                <Select
                  value={formState.district}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, district: value }))}
                  // Disable if loading OR if no province selected
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

            {/* Status is implicitly active for new users */}

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

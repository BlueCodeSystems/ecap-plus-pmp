import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHouseholdsByDistrict, getHouseholdArchivedRegister, DEFAULT_DISTRICT } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";

const HouseholdProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const { data: households, isLoading: isLoadingActive } = useQuery({
    queryKey: ["households", "district", district],
    queryFn: () => getHouseholdsByDistrict(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: archivedHouseholds, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["households", "archived", "district", district],
    queryFn: () => getHouseholdArchivedRegister(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const household = [...(households || []), ...(archivedHouseholds || [])].find((h: any) => {
    const vId = id?.toLowerCase();
    return (
      String(h.household_id || "").toLowerCase() === vId || 
      String(h.householdId || "").toLowerCase() === vId || 
      String(h.hh_id || "").toLowerCase() === vId || 
      String(h.id || "").toLowerCase() === vId || 
      String(h.unique_id || "").toLowerCase() === vId
    );
  });

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="Household Profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!household) {
    return (
      <DashboardLayout subtitle="Household Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-slate-500">Household record not found.</p>
          <Button onClick={() => navigate("/households")}>Back to Register</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout subtitle={`Household: ${id}`}>
      <PageIntro
        eyebrow="Household Profile"
        title={household.caregiver_name || household.name || "N/A"}
        description={`Detailed view for household ${id}.`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Caregiver Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</p>
                <p className="mt-1 font-semibold">{household.caregiver_name || household.name || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Household ID</p>
                <p className="mt-1 font-semibold">{id}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Case Worker</p>
              <p className="mt-1 font-semibold">{household.caseworker_name || household.cwac_member_name || "N/A"}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Location Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
              <p className="mt-1 font-semibold">{household.homeaddress || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Province</p>
              <p className="mt-1 font-semibold">{household.province || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">District</p>
              <p className="mt-1 font-semibold">{household.district || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ward</p>
              <p className="mt-1 font-semibold">{household.ward || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</p>
              <p className="mt-1 font-semibold">{household.facility || "N/A"}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Sub-Population Status
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(household).map(([key, value]) => {
              if (value === "1" || value === "true" || value === 1 || value === true) {
                return (
                  <Badge key={key} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 py-1 px-3">
                    {key.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default HouseholdProfile;

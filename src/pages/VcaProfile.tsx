import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChildrenByDistrict, getChildrenArchivedRegister, DEFAULT_DISTRICT } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, ClipboardCheck, Baby } from "lucide-react";
import LoadingDots from "@/components/aceternity/LoadingDots";

const calculateAge = (birthdate: any): number => {
  if (!birthdate) return 0;
  const dateStr = String(birthdate);

  const formats = [
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  let parsedDate: Date | null = null;

  for (const format of formats) {
    const parts = dateStr.match(format);
    if (parts) {
      if (format === formats[0]) {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      } else if (format === formats[1]) {
        parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
      } else {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      break;
    }
  }

  if (!parsedDate && !isNaN(Date.parse(dateStr))) {
    parsedDate = new Date(dateStr);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const m = today.getMonth() - parsedDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) {
    age--;
  }
  return age;
};

const VcaProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const { data: vcas, isLoading: isLoadingActive } = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: archivedVcas, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["vcas", "archived", "district", district],
    queryFn: () => getChildrenArchivedRegister(district ?? ""),
    enabled: Boolean(district),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const vca = [...(vcas || []), ...(archivedVcas || [])].find((v: any) => {
    const vId = id?.toLowerCase();
    return (
      String(v.uid || "").toLowerCase() === vId || 
      String(v.unique_id || "").toLowerCase() === vId || 
      String(v.vca_id || "").toLowerCase() === vId || 
      String(v.vcaid || "").toLowerCase() === vId || 
      String(v.child_id || "").toLowerCase() === vId || 
      String(v.id || "").toLowerCase() === vId
    );
  });

  if (isLoadingActive || isLoadingArchived) {
    return (
      <DashboardLayout subtitle="VCA Profile">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingDots />
        </div>
      </DashboardLayout>
    );
  }

  if (!vca) {
    return (
      <DashboardLayout subtitle="VCA Not Found">
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-slate-500">VCA record not found.</p>
          <Button onClick={() => navigate("/vcas")}>Back to Register</Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${vca.firstname || vca.name || ""} ${vca.lastname || ""}`.trim() || "N/A";

  return (
    <DashboardLayout subtitle={`VCA: ${id}`}>
      <PageIntro
        eyebrow="VCA Profile"
        title={fullName}
        description={`Detailed view for VCA ${id}.`}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" /> VCA Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Full Name</p>
                <p className="mt-1 font-semibold">{fullName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unique ID</p>
                <p className="mt-1 font-semibold">{id}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</p>
                <p className="mt-1 font-semibold">{vca.vca_gender || vca.gender || "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Age</p>
                <p className="mt-1 font-semibold">{calculateAge(vca.birthdate)} years</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Birthdate</p>
              <p className="mt-1 font-semibold">{vca.birthdate || "N/A"}</p>
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
              <p className="mt-1 font-semibold">{vca.homeaddress || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Province</p>
              <p className="mt-1 font-semibold">{vca.province || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">District</p>
              <p className="mt-1 font-semibold">{vca.district || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ward</p>
              <p className="mt-1 font-semibold">{vca.ward || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Facility</p>
              <p className="mt-1 font-semibold">{vca.facility || "N/A"}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Sub-Population Status
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(vca).map(([key, value]) => {
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

export default VcaProfile;

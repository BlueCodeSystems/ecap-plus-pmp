import { Flag, AlertTriangle, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getCaregiverServicesByDistrict, getVcaServicesByDistrict } from "@/lib/api";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const Flags = () => {
  const district = DEFAULT_DISTRICT;
  const vcaServicesQuery = useQuery({
    queryKey: ["flags", "vca-services", district],
    queryFn: () => getVcaServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });
  const caregiverServicesQuery = useQuery({
    queryKey: ["flags", "caregiver-services", district],
    queryFn: () => getCaregiverServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const vcaServices = vcaServicesQuery.data ?? [];
  const caregiverServices = caregiverServicesQuery.data ?? [];

  const flaggedItems = [
    ...vcaServices
      .filter((record) => pickValue(record as Record<string, unknown>, ["service_date", "visit_date"]) === "N/A")
      .slice(0, 3)
      .map((record) => ({
        title: "VCA Service Missing Date",
        detail: `VCA ${pickValue(record as Record<string, unknown>, ["vca_id", "vcaid", "child_id", "unique_id", "id"])} • Service date not provided`,
        status: "Review Needed",
      })),
    ...caregiverServices
      .filter((record) => pickValue(record as Record<string, unknown>, ["service_date", "visit_date"]) === "N/A")
      .slice(0, 3)
      .map((record) => ({
        title: "Caregiver Service Missing Date",
        detail: `Household ${pickValue(record as Record<string, unknown>, ["household_id", "householdId", "hh_id", "id", "unique_id"])} • Service date not provided`,
        status: "Pending",
      })),
  ].slice(0, 3);

  const isLoading = vcaServicesQuery.isLoading || caregiverServicesQuery.isLoading;
  const totalFlags = flaggedItems.length;

  return (
    <DashboardLayout subtitle="Flags">
      <PageIntro
        eyebrow="Flags"
        title="Resolve risks before they become gaps."
        description="Prioritize issues from DQA checks, service lags, and incomplete records."
        actions={
          <>
            <Badge className="bg-rose-100 text-rose-700">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  Loading <LoadingDots className="text-rose-700" />
                </span>
              ) : (
                `${totalFlags} Active Flags`
              )}
            </Badge>
            <Button variant="outline" className="border-slate-200">
              Review All Flags
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading && (
          <GlowCard>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading flags
              </CardTitle>
              <Flag className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                Gathering service records <LoadingDots className="text-slate-400" />
              </div>
            </CardContent>
          </GlowCard>
        )}
        {!isLoading &&
          flaggedItems.map((item, index) => (
            <GlowCard key={`${item.title}-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <Flag className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">{item.detail}</p>
                <Badge className="bg-amber-100 text-amber-700">{item.status}</Badge>
              </CardContent>
            </GlowCard>
          ))}
        {!isLoading && flaggedItems.length === 0 && (
          <GlowCard className="md:col-span-3">
            <CardContent className="py-6 text-center text-slate-500">
              No flagged records returned for the selected district.
            </CardContent>
          </GlowCard>
        )}
      </div>

      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle>Rapid Resolution Queue</CardTitle>
          </div>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            Assign Follow-ups
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            {district ? `District: ${district}` : "Set a default district to see queue stats."}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            {vcaServices.length} VCA service records reviewed
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            {caregiverServices.length} caregiver service records reviewed
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default Flags;

import { ShieldCheck, UsersRound } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DEFAULT_DISTRICT, getCaregiverServicesByDistrict } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const caregiverHighlights = [
  {
    title: "Caregiver Details",
    description: "Confirm screening status, referral pathway, and caregiver contact details.",
  },
  {
    title: "Household Details",
    description: "Review household size, facility catchment, and ART linkage.",
  },
  {
    title: "Index VCA Details",
    description: "Verify index child records and ensure follow-up schedules align.",
  },
];

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }
  return "N/A";
};

const CaregiverServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const district = user?.location || DEFAULT_DISTRICT;

  const servicesQuery = useQuery({
    queryKey: ["caregiver-services", "district", district],
    queryFn: () => getCaregiverServicesByDistrict(district ?? ""),
  });

  const allServices = servicesQuery.data ?? [];
  const services = useMemo(() => {
    if (!district) return allServices;
    return allServices.filter((s: any) => s.district === district);
  }, [allServices, district]);
  const recentServices = services.slice(0, 5);

  return (
    <DashboardLayout subtitle="Caregiver Services">
      <PageIntro
        eyebrow="Caregiver Services"
        title="Coordinate caregiver follow-ups with confidence."
        description="Track caregiver services, household assessments, and referral actions in one stream."
        actions={
          <>
            <Badge className="bg-emerald-100 text-emerald-700">
              {servicesQuery.isLoading ? (
                <span className="flex items-center gap-2">
                  Loading <LoadingDots className="text-emerald-700" />
                </span>
              ) : (
                `${services.length} Records`
              )}
            </Badge>
            <Button variant="outline" className="border-slate-200">
              Open Caregiver Queue
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {caregiverHighlights.map((highlight) => (
          <GlowCard key={highlight.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {highlight.title}
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{highlight.description}</p>
            </CardContent>
          </GlowCard>
        ))}
      </div>

      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-primary" />
            <CardTitle>Caregiver Service Actions</CardTitle>
          </div>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            Start Household Visit
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-4">
              {[
                "Home Visit",
                "ART Follow-up",
                "Counseling",
                "Referrals",
                "Case Plan Update",
                "Graduation Review",
              ].map((item) => (
                <Button key={item} variant="outline" className="border-slate-200">
                  {item}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </GlowCard>

      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Caregiver Services</CardTitle>
          <Badge variant="outline" className="border-slate-200 text-slate-600">
            {district ?? "No district set"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 w-[80px] hidden sm:table-cell">HH ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Service</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!district && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-slate-500">
                      Set `VITE_DEFAULT_DISTRICT` to load caregiver services.
                    </TableCell>
                  </TableRow>
                )}
                {servicesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <TableSkeleton rows={6} columns={4} />
                    </TableCell>
                  </TableRow>
                )}
                {recentServices.map((service, index) => {
                  const record = service as Record<string, unknown>;
                  const hhId = String(pickValue(record, ["household_id", "householdId", "hh_id", "unique_id", "id"]));
                  return (
                    <TableRow key={`${index}-${String(record.id ?? "service")}`} className="cursor-pointer hover:bg-slate-50" onClick={() => hhId !== "N/A" && navigate(`/profile/household-profile/${encodeURIComponent(hhId)}`)}>
                      <TableCell className="font-medium align-top hidden sm:table-cell">
                        <span className="text-xs">
                          {hhId}
                        </span>
                      </TableCell>
                      <TableCell className="align-top px-2 sm:px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 sm:hidden">
                            <span className="text-[9px] font-mono bg-slate-100 text-primary px-1 rounded">
                              {String(pickValue(record, ["household_id", "householdId", "hh_id", "id", "unique_id"]))}
                            </span>
                          </div>
                          <span className="text-sm font-medium leading-tight">
                            {String(pickValue(record, ["service", "service_name", "serviceName", "form_name"]))}
                          </span>
                          <span className="text-[10px] text-slate-500 sm:hidden">
                            {String(pickValue(record, ["service_date", "visit_date", "created_at", "date"]))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-top text-xs">
                        {String(pickValue(record, ["service_date", "visit_date", "created_at", "date"]))}
                      </TableCell>
                      <TableCell className="text-right align-top px-2 sm:px-4">
                        <Badge variant="outline" className="text-[9px] h-4.5 px-1 font-normal border-slate-200">
                          {String(pickValue(record, ["status", "state", "outcome"]))}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!servicesQuery.isLoading && district && services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-slate-500">
                      No caregiver services found.
                    </TableCell>
                  </TableRow>
                )}
                {servicesQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-destructive">
                      {(servicesQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default CaregiverServices;

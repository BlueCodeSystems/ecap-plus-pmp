import { ShieldCheck, UsersRound } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useQuery } from "@tanstack/react-query";
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

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const CaregiverServices = () => {
  const district = DEFAULT_DISTRICT;
  const servicesQuery = useQuery({
    queryKey: ["caregiver-services", "district", district],
    queryFn: () => getCaregiverServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const services = servicesQuery.data ?? [];
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
        <CardContent className="flex flex-wrap gap-2">
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
                <TableHead>Household ID</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell colSpan={4} className="py-6 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Loading services</span>
                      <LoadingDots className="text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {recentServices.map((service, index) => {
                const record = service as Record<string, unknown>;
                return (
                  <TableRow key={`${index}-${String(record.id ?? "service")}`}>
                    <TableCell className="font-medium">
                      {String(
                        pickValue(record, [
                          "household_id",
                          "householdId",
                          "hh_id",
                          "id",
                          "unique_id",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, ["service", "service_name", "serviceName", "form_name"]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, ["service_date", "visit_date", "created_at", "date"]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(pickValue(record, ["status", "state", "outcome"]))}
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

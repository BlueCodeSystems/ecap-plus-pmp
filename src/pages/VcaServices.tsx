import { CheckCircle2, Flag, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getVcaServicesByDistrict } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const serviceModules = [
  "Household Screening",
  "Family Members",
  "Visits",
  "Case Plans",
  "Household Assessment",
  "Graduation",
  "All Services",
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

const VcaServices = () => {
  const district = DEFAULT_DISTRICT;
  const servicesQuery = useQuery({
    queryKey: ["vca-services", "district", district],
    queryFn: () => getVcaServicesByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const services = servicesQuery.data ?? [];
  const recentServices = services.slice(0, 5);

  return (
    <DashboardLayout subtitle="VCA Services">
      <PageIntro
        eyebrow="VCA Services"
        title="Deliver services, track outcomes, and graduate households."
        description="Open the full VCA service workflow and ensure every visit, assessment, and case plan is recorded."
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
              Open All Services
            </Button>
          </>
        }
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <CardTitle>Service Modules</CardTitle>
          </div>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            Start New Service
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {serviceModules.map((module) => (
              <Button key={module} variant="outline" className="border-slate-200">
                {module}
              </Button>
            ))}
            <Button variant="destructive" className="gap-2">
              <Flag className="h-4 w-4" />
              Flag This Record
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Graduation Information
              </div>
              <p className="mt-2 text-sm text-emerald-700">
                Case status: Active • Reason: N/A • De-registration date: N/A
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-800">Caregiver Primary Information</div>
              <p className="mt-2 text-sm text-amber-700">
                Verify caregiver details, consent, and household identifiers before starting a visit.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/90">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-700">Recent VCA Services</div>
              <p className="text-xs text-slate-500">
                {district ? `District: ${district}` : "Set a default district to load services."}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VCA ID</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!district && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-slate-500">
                      Set `VITE_DEFAULT_DISTRICT` to load services.
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
                          pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id", "id"]),
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
                      No services found.
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

export default VcaServices;

import { CheckCircle2, Flag, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
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

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
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

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = topScrollRef.current;
    const bottom = bottomScrollRef.current;

    if (!top || !bottom) return;

    const handleTopScroll = () => {
      if (bottom) bottom.scrollLeft = top.scrollLeft;
    };

    const handleBottomScroll = () => {
      if (top) top.scrollLeft = bottom.scrollLeft;
    };

    top.addEventListener('scroll', handleTopScroll);
    bottom.addEventListener('scroll', handleBottomScroll);

    return () => {
      top.removeEventListener('scroll', handleTopScroll);
      bottom.removeEventListener('scroll', handleBottomScroll);
    };
  }, [services.length]);

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
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 pb-4">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
            <div className="max-w-full overflow-hidden space-y-2">
              {/* Top Scrollbar container */}
              <div
                ref={topScrollRef}
                className="w-full overflow-x-auto overflow-y-hidden h-4 bg-slate-50 border border-slate-200 rounded-t-lg px-1"
              >
                <div className="min-w-[800px] h-px" />
              </div>

              <div ref={bottomScrollRef} className="w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[120px] text-sm font-bold text-slate-900 h-12">ID</TableHead>
                      <TableHead className="text-sm font-bold text-slate-900 h-12">Service</TableHead>
                      <TableHead className="hidden sm:table-cell text-sm font-bold text-slate-900 h-12">Date</TableHead>
                      <TableHead className="text-right text-sm font-bold text-slate-900 h-12">Status</TableHead>
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
                        <TableCell colSpan={4} className="p-0">
                          <TableSkeleton rows={6} columns={4} />
                        </TableCell>
                      </TableRow>
                    )}
                    {recentServices.map((service, index) => {
                      const record = service as Record<string, unknown>;
                      return (
                        <TableRow key={`${index}-${String(record.id ?? "service")}`}>
                          <TableCell className="font-bold align-middle">
                            <span className="text-sm text-slate-900">{String(pickValue(record, ["vca_id", "vcaid", "child_id", "unique_id", "id"]))}</span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-slate-900 mb-1">
                                {String(pickValue(record, ["service", "service_name", "serviceName", "form_name"]))}
                              </span>
                              <span className="text-xs text-slate-500 sm:hidden">
                                {String(pickValue(record, ["service_date", "visit_date", "created_at", "date"]))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell align-middle text-sm font-medium text-slate-600">
                            {String(pickValue(record, ["service_date", "visit_date", "created_at", "date"]))}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <Badge variant="outline" className="text-xs h-7 px-3 font-bold border-slate-200 bg-slate-50 text-slate-700 shadow-sm">
                              {String(pickValue(record, ["status", "state", "outcome"]))}
                            </Badge>
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
            </div>
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaServices;

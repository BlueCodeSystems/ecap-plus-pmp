import { Archive, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getChildrenArchivedRegister } from "@/lib/api";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const VcaArchivedRegister = () => {
  const district = DEFAULT_DISTRICT;
  const archivedQuery = useQuery({
    queryKey: ["vcas", "archived", district],
    queryFn: () => getChildrenArchivedRegister(district ?? ""),
    enabled: Boolean(district),
  });

  const archivedVcas = archivedQuery.data ?? [];

  return (
    <DashboardLayout subtitle="VCA Archived Register">
      <PageIntro
        eyebrow="VCA Archived Register"
        title="Keep historical VCA records accessible."
        description="Review archived VCAs for audits, reactivation, or longitudinal reporting."
        actions={
          <Button variant="outline" className="border-slate-200">
            Restore VCA
          </Button>
        }
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            <CardTitle>Archived VCAs</CardTitle>
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search archives..." className="pl-9 border-slate-200 bg-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VCA ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Archived On</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!district && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    Set `VITE_DEFAULT_DISTRICT` to load archived VCAs.
                  </TableCell>
                </TableRow>
              )}
              {archivedQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Loading archived VCAs</span>
                      <LoadingDots className="text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {archivedVcas.map((vca, index) => {
                const record = vca as Record<string, unknown>;
                const id = pickValue(record, ["vca_id", "vcaid", "id", "unique_id", "child_id"]);
                return (
                  <TableRow key={`${String(id)}-${index}`}>
                    <TableCell className="font-medium">{String(id)}</TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "facility",
                          "facility_name",
                          "facilityName",
                          "health_facility",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "archived_on",
                          "archivedOn",
                          "date_archived",
                          "de_registration_date",
                          "updated_at",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, ["reason", "archived_reason", "status", "case_status"]),
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="border-slate-200">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!archivedQuery.isLoading && district && archivedVcas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    No archived VCAs found.
                  </TableCell>
                </TableRow>
              )}
              {archivedQuery.isError && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-destructive">
                    {(archivedQuery.error as Error).message}
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

export default VcaArchivedRegister;

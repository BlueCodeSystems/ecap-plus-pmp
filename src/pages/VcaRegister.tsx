import { Filter, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DEFAULT_DISTRICT, getChildrenByDistrict } from "@/lib/api";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const VcaRegister = () => {
  const district = DEFAULT_DISTRICT;
  const vcasQuery = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const vcas = vcasQuery.data ?? [];

  return (
    <DashboardLayout subtitle="VCA Register">
      <PageIntro
        eyebrow="VCA Register"
        title="Keep every child record service-ready."
        description="Monitor screening status, last service dates, and viral suppression status so follow-up teams can act quickly."
        actions={
          <>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              Advanced Search
            </Button>
            <Button variant="outline" className="border-slate-200">
              Export Register
            </Button>
          </>
        }
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>VCA Register</CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              {district ? `Filter ${district} District VCAs by sub-populations` : "Set a default district to load records."}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["HEI", "CALHIV", "CWLHIV", "AGYW", "CSV", "CSFW"].map((tag) => (
              <Badge key={tag} variant="outline" className="border-slate-200 text-slate-600">
                {tag}: All
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <Badge variant="outline" className="border-slate-200">Filter by gender</Badge>
              <Badge variant="outline" className="border-slate-200">Virally suppressed</Badge>
              <Badge variant="outline" className="border-slate-200">Filter by age</Badge>
            </div>
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="You can search here..."
                className="pl-9 border-slate-200 bg-white"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screened</TableHead>
                <TableHead>VCA Id</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Birth Date</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Last Service Date</TableHead>
                <TableHead>Virally Suppressed</TableHead>
                <TableHead>Last edited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!district && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                    Set `VITE_DEFAULT_DISTRICT` to load VCA records.
                  </TableCell>
                </TableRow>
              )}
              {vcasQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Loading VCAs</span>
                      <LoadingDots className="text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {vcas.map((vca, index) => {
                const record = vca as Record<string, unknown>;
                const id = pickValue(record, ["vca_id", "vcaid", "id", "unique_id", "child_id"]);
                return (
                  <TableRow key={`${String(id)}-${index}`}>
                    <TableCell>
                      {pickValue(record, ["screened", "is_screened", "screening_status"]) ===
                      "N/A"
                        ? "—"
                        : "✓"}
                    </TableCell>
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
                        pickValue(record, ["birth_date", "birthDate", "dob", "date_of_birth"]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(pickValue(record, ["gender", "sex"]))}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "last_service_date",
                          "lastServiceDate",
                          "service_date",
                          "last_visit_date",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "virally_suppressed",
                          "viral_suppressed",
                          "viralSuppressed",
                          "suppressed",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, ["last_edited", "lastEdited", "updated_at", "updatedAt"]),
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
              {!vcasQuery.isLoading && district && vcas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-slate-500">
                    No VCA records found.
                  </TableCell>
                </TableRow>
              )}
              {vcasQuery.isError && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-destructive">
                    {(vcasQuery.error as Error).message}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaRegister;

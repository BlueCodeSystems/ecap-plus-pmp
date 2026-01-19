import { HeartPulse, Search } from "lucide-react";
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
import { DEFAULT_DISTRICT, getMothersByDistrict } from "@/lib/api";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const IndexMotherRegister = () => {
  const district = DEFAULT_DISTRICT;
  const mothersQuery = useQuery({
    queryKey: ["mothers", "district", district],
    queryFn: () => getMothersByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const mothers = mothersQuery.data ?? [];

  return (
    <DashboardLayout subtitle="Index Mother Register">
      <PageIntro
        eyebrow="Index Mother Register"
        title="Support maternal care continuity."
        description="Track referrals, ART follow-up, and service uptake for every index mother in the program."
        actions={
          <>
            <Badge className="bg-emerald-100 text-emerald-700">Active Cases</Badge>
            <Button variant="outline" className="border-slate-200">
              Export Register
            </Button>
          </>
        }
      />

      <GlowCard>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" />
            <CardTitle>Index Mothers Register</CardTitle>
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search index mothers..."
              className="pl-9 border-slate-200 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index Mother ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Caseworker</TableHead>
                <TableHead>HIV Status</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!district && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    Set `VITE_DEFAULT_DISTRICT` to load index mothers.
                  </TableCell>
                </TableRow>
              )}
              {mothersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Loading index mothers</span>
                      <LoadingDots className="text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {mothers.map((mother, index) => {
                const record = mother as Record<string, unknown>;
                const id = pickValue(record, ["mother_id", "id", "unique_id", "index_id"]);
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
                        pickValue(record, ["caseworker_name", "caseworkerName", "caseworker"]),
                      )}
                    </TableCell>
                    <TableCell>{String(pickValue(record, ["hiv_status", "hivStatus"]))}</TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "last_visit_date",
                          "lastVisit",
                          "last_service_date",
                          "updated_at",
                        ]),
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
              {!mothersQuery.isLoading && district && mothers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    No index mothers found.
                  </TableCell>
                </TableRow>
              )}
              {mothersQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-destructive">
                    {(mothersQuery.error as Error).message}
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

export default IndexMotherRegister;

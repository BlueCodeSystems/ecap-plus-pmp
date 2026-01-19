import { Filter, Search, Sparkles } from "lucide-react";
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
import { DEFAULT_DISTRICT, getHouseholdsByDistrict } from "@/lib/api";

const pickValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }
  return "N/A";
};

const HouseholdRegister = () => {
  const district = DEFAULT_DISTRICT;
  const householdsQuery = useQuery({
    queryKey: ["households", "district", district],
    queryFn: () => getHouseholdsByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const households = householdsQuery.data ?? [];

  return (
    <DashboardLayout subtitle="Household Register">
      <PageIntro
        eyebrow="Household Register"
        title="Track household screening and follow-up readiness."
        description="Filter households by sub-population, follow service history, and flag cases that need immediate outreach."
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
            <CardTitle>Household Register</CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              {district ? `Filter ${district} District households by sub-populations` : "Set a default district to load records."}
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
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Filter Last Service Date By:
              <Badge className="bg-emerald-100 text-emerald-700">New</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-slate-200">
                Select date option
              </Button>
              <Button variant="outline" className="border-slate-200">
                Reset Filters
              </Button>
            </div>
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="You can search here..."
                className="pl-9 border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Screened</TableHead>
                <TableHead>Household ID</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Caseworker Name</TableHead>
                <TableHead>Caseworker Household Count</TableHead>
                <TableHead>Last Service Date</TableHead>
                <TableHead>Last edited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!district && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    Set `VITE_DEFAULT_DISTRICT` to load household records.
                  </TableCell>
                </TableRow>
              )}
              {householdsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">Loading households</span>
                      <LoadingDots className="text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {households.map((household, index) => {
                const record = household as Record<string, unknown>;
                const id = pickValue(record, ["household_id", "householdId", "hh_id", "id", "unique_id"]);
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
                        pickValue(record, ["caseworker_name", "caseworkerName", "caseworker"]),
                      )}
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "caseworker_household_count",
                          "caseworkerHouseholdCount",
                          "caseworker_count",
                        ]),
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700">
                        {String(
                          pickValue(record, [
                            "last_service_date",
                            "lastServiceDate",
                            "service_date",
                            "last_visit_date",
                          ]),
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {String(
                        pickValue(record, [
                          "last_edited",
                          "lastEdited",
                          "updated_at",
                          "updatedAt",
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
              {!householdsQuery.isLoading && district && households.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    No household records found.
                  </TableCell>
                </TableRow>
              )}
              {householdsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-destructive">
                    {(householdsQuery.error as Error).message}
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

export default HouseholdRegister;

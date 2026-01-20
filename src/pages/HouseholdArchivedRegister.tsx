import { useState, useMemo } from "react";
import { Archive, Search, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getHouseholdArchivedRegister } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const subPopulationFilterLabels = {
  calhiv: "CALHIV",
  hei: "HEI",
  cwlhiv: "CWLHIV",
  agyw: "AGYW",
  csv: "C/SV",
  cfsw: "CFSW",
  abym: "ABYM",
};

const graduationOptions = [
  "Graduated (Household has met the graduation benchmarks in ALL domains)",
  "Exited without graduation",
  "Transferred to other OVC program",
  "Lost to follow-up",
  "Passed on",
  "Aging without transition plan",
  "Moved (Relocated)",
  "Other",
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

const HouseholdArchivedRegister = () => {
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );
  const [graduationFilter, setGraduationFilter] = useState<string>("all");

  const archivedQuery = useQuery({
    queryKey: ["households", "archived", district, graduationFilter],
    queryFn: () =>
      getHouseholdArchivedRegister(district ?? "", {
        de_registration_reason: graduationFilter === "all" ? undefined : graduationFilter,
      }),
    enabled: Boolean(district),
  });

  const archivedHouseholds = useMemo(() => archivedQuery.data ?? [], [archivedQuery.data]);

  const filteredHouseholds = useMemo(() => {
    return archivedHouseholds.filter((household: any) => {
      // Global Search
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch = searchQuery
        ? (household.household_id?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.caregiver_name?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.homeaddress?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.ward?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.caseworker_name?.toLowerCase() || "").includes(lowerCaseQuery)
        : true;

      // Sub-population Filters
      const matchesFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;
        const recordValue = household[key];
        // Check for '1', 'true', '0', 'false' string or boolean values
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      return matchesSearch && matchesFilters;
    });
  }, [archivedHouseholds, searchQuery, subPopulationFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setSubPopulationFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSubPopulationFilters(
      Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
    );
    setGraduationFilter("all");
  };

  const exportToCSV = () => {
    if (filteredHouseholds.length === 0) return;

    try {
      const headers = [
        "Household ID",
        "Caregiver Name",
        "Home Address",
        "Facility",
        "Province",
        "District",
        "Ward",
        "Case Worker",
        "Archived On",
        "Reason"
      ];

      const keys = [
        "household_id",
        "caregiver_name",
        "homeaddress",
        "facility",
        "province",
        "district",
        "ward",
        "caseworker_name",
        "archived_on",
        "reason"
      ];

      const csvContent = [
        headers.join(","),
        ...filteredHouseholds.map((row: any) => {
          // Helper to get value or try alternate keys for 'reason'
          const getValue = (key: string) => {
            if (key === 'reason') {
              return pickValue(row, ["reason", "archived_reason", "status", "de_registration_reason"]);
            }
            if (key === 'archived_on') {
              return pickValue(row, ["archived_on", "archivedOn", "date_archived", "de_registration_date", "updated_at"]);
            }
            return row[key] ?? "";
          };

          return keys.map((key) => {
            const value = getValue(key);
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          }).join(",");
        }),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `archived_households_${district}.csv`;
      link.click();
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const getAddressString = (record: any) => {
    const parts = [
      record.homeaddress && `Address: ${record.homeaddress}`,
      record.facility && `Facility: ${record.facility}`,
      record.province && `Province: ${record.province}`,
      record.district && `District: ${record.district}`,
      record.ward && `Ward: ${record.ward}`,
    ].filter(Boolean);
    return parts.join("\n");
  };

  return (
    <DashboardLayout subtitle="Household Archived Register">
      <PageIntro
        eyebrow="Register"
        title="Household Archived Register"
        description="Reference closed or graduated households while keeping current registers focused."
        actions={
          <Button variant="outline" className="border-slate-200" onClick={exportToCSV}>
            Export to CSV
          </Button>
        }
      />

      <GlowCard>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-primary" />
              <CardTitle>Archived Households</CardTitle>
            </div>
            <div className="mt-2 text-sm text-amber-600 font-medium">
              Note: Only deregistered caregivers are shown.
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {/* Sub-population Filters */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Filter by Sub Population</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                  <div key={key} className="flex flex-col items-start gap-1">
                    <span className="text-xs text-slate-500 font-medium">{label}</span>
                    <Select
                      value={subPopulationFilters[key]}
                      onValueChange={(val) => handleFilterChange(key, val)}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Graduation Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Filter by Graduation</h3>
              <Select
                value={graduationFilter}
                onValueChange={setGraduationFilter}
              >
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Select graduation reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {graduationOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t pt-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" onClick={handleClearFilters} className="text-slate-600">
              Clear Filters
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Household ID</TableHead>
                  <TableHead className="w-[150px]">Caregiver Name</TableHead>
                  <TableHead className="min-w-[200px]">Household Details</TableHead>
                  <TableHead className="w-[150px]">Case Worker</TableHead>
                  <TableHead className="w-[120px]">Archived On</TableHead>
                  <TableHead className="w-[180px]">Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!district && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                      Set `VITE_DEFAULT_DISTRICT` to load archived households.
                    </TableCell>
                  </TableRow>
                )}
                {archivedQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading archived households</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredHouseholds.length === 0 && !archivedQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                      No archived households found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
                {filteredHouseholds.map((household: any, index: number) => {
                  const id = pickValue(household, ["household_id", "householdId", "hh_id", "id", "unique_id"]);
                  return (
                    <TableRow key={`${String(id)}-${index}`}>
                      <TableCell className="font-medium">{String(id)}</TableCell>
                      <TableCell>{String(pickValue(household, ["caregiver_name", "name"]))}</TableCell>
                      <TableCell>
                        <div className="whitespace-pre-line text-sm text-slate-600 leading-snug">
                          {getAddressString(household)}
                        </div>
                      </TableCell>
                      <TableCell>{String(pickValue(household, ["caseworker_name", "caseworker"]))}</TableCell>
                      <TableCell>
                        {String(
                          pickValue(household, [
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
                          pickValue(household, ["reason", "archived_reason", "status", "case_status", "de_registration_reason"]),
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

                {archivedQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-destructive">
                      {(archivedQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-slate-400 text-right">
            Showing {filteredHouseholds.length} records
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default HouseholdArchivedRegister;

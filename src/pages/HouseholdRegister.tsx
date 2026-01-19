import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getHouseholdsByDistrict } from "@/lib/api";
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
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );

  const householdsQuery = useQuery({
    queryKey: ["households", "district", district],
    queryFn: () => getHouseholdsByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const households = useMemo(() => householdsQuery.data ?? [], [householdsQuery.data]);

  const filteredHouseholds = useMemo(() => {
    return households.filter((household: any) => {
      // Global Search
      const matchesSearch = searchQuery
        ? Object.values(household).some((val: any) =>
          val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
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
  }, [households, searchQuery, subPopulationFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setSubPopulationFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSubPopulationFilters(
      Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
    );
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
        "Screened",
        "Last Service Date"
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
        "screened",
        "last_service_date"
      ];

      const csvContent = [
        headers.join(","),
        ...filteredHouseholds.map((row: any) =>
          keys
            .map((key) => {
              const value = row[key] ?? "";
              // Escape quotes and wrap in quotes if contains comma or quote
              const stringValue = String(value).replace(/"/g, '""');
              return `"${stringValue}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `households_${district}.csv`;
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
    <DashboardLayout subtitle="Household Register">
      <PageIntro
        eyebrow="Register"
        title="All District Households Register"
        description="Filter households by sub-population and view detailed records."
        actions={
          <Button variant="outline" className="border-slate-200" onClick={exportToCSV}>
            Export to CSV
          </Button>
        }
      />

      <GlowCard>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Household Register</CardTitle>
              <div className="mt-2 text-sm text-amber-600 font-medium">
                Note: Only active caregivers are shown.
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Filter by Sub Population</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                  <Select
                    value={subPopulationFilters[key]}
                    onValueChange={(val) => handleFilterChange(key, val)}
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs">
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Household ID</TableHead>
                  <TableHead className="w-[200px]">Caregiver Name</TableHead>
                  <TableHead className="min-w-[300px]">Household Details</TableHead>
                  <TableHead className="w-[150px]">Case Worker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {householdsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading households</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredHouseholds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      No households found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHouseholds.map((household: any, index: number) => {
                    const id = pickValue(household, ["household_id", "householdId"]);
                    return (
                      <TableRow key={`${id}-${index}`}>
                        <TableCell className="font-medium">{String(id)}</TableCell>
                        <TableCell>{String(pickValue(household, ["caregiver_name", "name"]))}</TableCell>
                        <TableCell>
                          <div className="whitespace-pre-line text-sm text-slate-600 leading-snug">
                            {getAddressString(household)}
                          </div>
                        </TableCell>
                        <TableCell>{String(pickValue(household, ["caseworker_name", "cwac_member_name"]))}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

export default HouseholdRegister;

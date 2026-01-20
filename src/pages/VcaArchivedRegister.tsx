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
import { DEFAULT_DISTRICT, getChildrenArchivedRegister } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const subPopulationFilterLabels = {
  calhiv: "C/ALHIV",
  hei: "HEI",
  cwlhiv: "C/WLHIV",
  agyw: "AGYW",
  csv: "C/SV",
  cfsw: "CFSW",
  abym: "ABYM",
  caahh: "CAAHH",
  caichh: "CAICHH",
  caich: "CAICH",
  calwd: "CALWD",
  caifhh: "CAIFHH",
  muc: "MUC",
  pbfw: "PBFW"
};

const filterKeyToDataKey: Record<string, string> = {
  caahh: "child_adolescent_in_aged_headed_household",
  caichh: "child_adolescent_in_chronically_ill_headed_household",
  caich: "child_adolescent_in_child_headed_household",
  calwd: "child_adolescent_living_with_disability",
  caifhh: "child_adolescent_in_female_headed_household",
  muc: "under_5_malnourished",
  pbfw: "pbfw",
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

const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0;

  const formats = [
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  let parsedDate: Date | null = null;
  let usedFormatIndex = -1;

  for (let i = 0; i < formats.length; i++) {
    const parts = birthdate.match(formats[i]);
    if (parts) {
      if (i === 0) {
        // DD-MM-YYYY
        parsedDate = new Date(
          parseInt(parts[3]),
          parseInt(parts[2]) - 1,
          parseInt(parts[1])
        );
      } else if (i === 1) {
        // YYYY-MM-DD
        parsedDate = new Date(
          parseInt(parts[1]),
          parseInt(parts[2]) - 1,
          parseInt(parts[3])
        );
      } else {
        // MM/DD/YYYY
        parsedDate = new Date(
          parseInt(parts[3]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      }
      usedFormatIndex = i;
      break;
    }
  }

  // Fallback for valid ISO strings not caught by regex
  if (!parsedDate && !isNaN(Date.parse(birthdate))) {
    parsedDate = new Date(birthdate);
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - parsedDate.getFullYear();
  const m = today.getMonth() - parsedDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsedDate.getDate())) {
    age--;
  }
  return age;
};

const VcaArchivedRegister = () => {
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );
  const [graduationFilter, setGraduationFilter] = useState<string>("all");

  const archivedQuery = useQuery({
    queryKey: ["vcas", "archived", district, graduationFilter],
    queryFn: () =>
      getChildrenArchivedRegister(district ?? "", {
        reason: graduationFilter === "all" ? undefined : graduationFilter,
      }),
    enabled: Boolean(district),
  });

  const archivedVcas = useMemo(() => archivedQuery.data ?? [], [archivedQuery.data]);

  const filteredVcas = useMemo(() => {
    return archivedVcas.filter((vca: any) => {
      // Global Search
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch = searchQuery
        ? (vca.vca_id?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (vca.uid?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (vca.firstname?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (vca.lastname?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (vca.homeaddress?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (vca.ward?.toLowerCase() || "").includes(lowerCaseQuery)
        : true;

      // Sub-population Filters
      const matchesFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;

        // Map UI filter key to actual data key if necessary
        const dataKey = filterKeyToDataKey[key] || key;
        const recordValue = vca[dataKey];

        // Check for '1', 'true', '0', 'false', string or boolean values
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      return matchesSearch && matchesFilters;
    });
  }, [archivedVcas, searchQuery, subPopulationFilters]);

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
    if (filteredVcas.length === 0) return;

    try {
      const headers = [
        "VCA ID",
        "Full Name",
        "Gender",
        "Age",
        "Home Address",
        "Facility",
        "Province",
        "District",
        "Ward",
        "Archived On",
        "Reason"
      ];

      const keys = [
        "uid", // or vca_id
        "fullname", // processed
        "vca_gender",
        "age", // processed
        "homeaddress",
        "facility",
        "province",
        "district",
        "ward",
        "archived_on",
        "reason"
      ];

      const csvContent = [
        headers.join(","),
        ...filteredVcas.map((row: any) => {
          const getValue = (key: string) => {
            if (key === 'fullname') return `${row.firstname || ''} ${row.lastname || ''}`.trim();
            if (key === 'age') return calculateAge(row.birthdate);
            if (key === 'reason') return pickValue(row, ["reason", "archived_reason", "status", "de_registration_reason"]);
            if (key === 'archived_on') return pickValue(row, ["archived_on", "archivedOn", "date_archived", "de_registration_date", "updated_at"]);
            if (key === 'uid') return pickValue(row, ["uid", "vca_id", "id", "unique_id"]);
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
      link.download = `archived_vcas_${district}.csv`;
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
    <DashboardLayout subtitle="VCA Archived Register">
      <PageIntro
        eyebrow="Register"
        title="VCA Archived Register"
        description="Reference closed or graduated VCAs while keeping current registers focused."
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
              <CardTitle>Archived VCAs</CardTitle>
            </div>
            <div className="mt-2 text-sm text-amber-600 font-medium">
              Note: Only deregistered VCAs are shown.
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
                className="pl-9 border-slate-200 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <TableHead className="w-[120px]">VCA ID</TableHead>
                  <TableHead className="w-[150px]">Full Name</TableHead>
                  <TableHead className="w-[80px]">Gender</TableHead>
                  <TableHead className="w-[60px]">Age</TableHead>
                  <TableHead className="min-w-[200px]">Household Details</TableHead>
                  <TableHead className="w-[120px]">Archived On</TableHead>
                  <TableHead className="w-[180px]">Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!district && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      Set `VITE_DEFAULT_DISTRICT` to load archived VCAs.
                    </TableCell>
                  </TableRow>
                )}
                {archivedQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading archived VCAs</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredVcas.length === 0 && !archivedQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                      No archived VCAs found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
                {filteredVcas.map((vca: any, index: number) => {
                  const id = pickValue(vca, ["vca_id", "vcaid", "id", "unique_id", "child_id", "uid"]);
                  const fullName = `${vca.firstname || ''} ${vca.lastname || ''}`.trim();
                  const age = calculateAge(vca.birthdate);

                  return (
                    <TableRow key={`${String(id)}-${index}`}>
                      <TableCell className="font-medium">{String(id)}</TableCell>
                      <TableCell className="font-medium">{fullName || 'N/A'}</TableCell>
                      <TableCell>{vca.vca_gender || 'N/A'}</TableCell>
                      <TableCell>{age}</TableCell>
                      <TableCell>
                        <div className="whitespace-pre-line text-sm text-slate-600 leading-snug">
                          {getAddressString(vca)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {String(
                          pickValue(vca, [
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
                          pickValue(vca, ["reason", "archived_reason", "status", "case_status"]),
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
                    <TableCell colSpan={8} className="py-8 text-center text-destructive">
                      {(archivedQuery.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-slate-400 text-right">
            Showing {filteredVcas.length} records
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaArchivedRegister;

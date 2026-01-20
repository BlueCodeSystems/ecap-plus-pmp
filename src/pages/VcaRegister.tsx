import { useState, useMemo } from "react";
import { Filter, Search } from "lucide-react";
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
import { DEFAULT_DISTRICT, getChildrenByDistrict } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Full list of 14 filters from legacy TreeTable.tsx
const subPopulationFilterLabels = {
  calhiv: 'C/ALHIV',
  hei: 'HEI',
  cwlhiv: 'C/WLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM',
  caahh: 'CAAHH',
  caichh: 'CAICHH',
  caich: 'CAICH',
  calwd: 'CALWD',
  caifhh: 'CAIFHH',
  muc: 'MUC',
  pbfw: 'PBFW'
};

// Mapping for filters where the data key differs from the filter key
const filterKeyToDataKey: Record<string, string> = {
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
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

const calculateAge = (birthdate: any): number => {
  if (!birthdate) return 0;
  const dateStr = String(birthdate);

  const formats = [
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  let parsedDate: Date | null = null;

  for (const format of formats) {
    const parts = dateStr.match(format);
    if (parts) {
      if (format === formats[0]) {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      } else if (format === formats[1]) {
        parsedDate = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
      } else {
        parsedDate = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      break;
    }
  }

  // Try standard date parsing if regex failed but it's a valid ISO string
  if (!parsedDate && !isNaN(Date.parse(dateStr))) {
    parsedDate = new Date(dateStr);
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


const VcaRegister = () => {
  const { user } = useAuth();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );

  const vcasQuery = useQuery({
    queryKey: ["vcas", "district", district],
    queryFn: () => getChildrenByDistrict(district ?? ""),
    enabled: Boolean(district),
  });

  const vcas = useMemo(() => vcasQuery.data ?? [], [vcasQuery.data]);

  const filteredVcas = useMemo(() => {
    return vcas.filter((vca: any) => {
      // Global Search
      const lowerCaseQuery = searchQuery.toLowerCase();
      const addressString = [
        vca.homeaddress,
        vca.facility,
        vca.province,
        vca.district,
        vca.ward
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = searchQuery
        ? (vca.uid?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.firstname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        (vca.lastname?.toLowerCase() || '').includes(lowerCaseQuery) ||
        addressString.includes(lowerCaseQuery) ||
        (vca.vca_gender?.toLowerCase() || '').includes(lowerCaseQuery)
        : true;

      // Sub-population Filters
      const matchesFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;

        let dataKey = key;
        if (key in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[key];
        }

        const recordValue = vca[dataKey];
        // Check for '1', 'true', '0', 'false' string or boolean values
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      return matchesSearch && matchesFilters;
    });
  }, [vcas, searchQuery, subPopulationFilters]);

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
    if (filteredVcas.length === 0) return;

    try {
      const headers = [
        "Unique ID",
        "First Name",
        "Last Name",
        "Gender",
        "Birth Date",
        "Home Address",
        "Facility",
        "Province",
        "District",
        "Ward",
        "Last Service Date",
        "Virally Suppressed"
      ];

      const keys = [
        "uid",
        "firstname",
        "lastname",
        "vca_gender",
        "birthdate",
        "homeaddress",
        "facility",
        "province",
        "district",
        "ward",
        "last_service_date",
        "virally_suppressed"
      ];

      const csvContent = [
        headers.join(","),
        ...filteredVcas.map((row: any) =>
          keys
            .map((key) => {
              const value = row[key] ?? "";
              const stringValue = String(value).replace(/"/g, '""');
              return `"${stringValue}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `vcas_${district}.csv`;
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
    <DashboardLayout subtitle="VCA Register">
      <PageIntro
        eyebrow="Register"
        title="All District VCAs Register"
        description="Filter VCAs by sub-population and view detailed records."
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
              <CardTitle>VCA Register</CardTitle>
              <div className="mt-2 text-sm text-amber-600 font-medium">
                Note: Only active VCAs are shown.
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
                  <TableHead className="w-[120px]">Unique ID</TableHead>
                  <TableHead className="w-[180px]">Full Name</TableHead>
                  <TableHead className="w-[80px]">Gender</TableHead>
                  <TableHead className="w-[60px]">Age</TableHead>
                  <TableHead className="min-w-[250px]">Household Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vcasQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm">Loading VCAs</span>
                        <LoadingDots className="text-slate-400" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredVcas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      No VCAs found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVcas.map((vca: any, index: number) => {
                    const id = pickValue(vca, ["uid", "unique_id", "vca_id"]);
                    return (
                      <TableRow key={`${id}-${index}`}>
                        <TableCell className="font-medium">{String(id)}</TableCell>
                        <TableCell>{String(pickValue(vca, ["firstname", "name"]))} {String(pickValue(vca, ["lastname"]))}</TableCell>
                        <TableCell>{String(pickValue(vca, ["vca_gender", "gender"]))}</TableCell>
                        <TableCell>{calculateAge(vca.birthdate)}</TableCell>
                        <TableCell>
                          <div className="whitespace-pre-line text-sm text-slate-600 leading-snug">
                            {getAddressString(vca)}
                          </div>
                        </TableCell>
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
            Showing {filteredVcas.length} records
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaRegister;

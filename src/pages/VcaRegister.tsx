import { useState, useMemo, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getChildrenByDistrict } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";


const ITEMS_PER_PAGE = 50;

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

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlDistrict = searchParams.get("district");
  const district = urlDistrict || user?.location || DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subPopulationFilters]);

  const totalPages = Math.ceil(filteredVcas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVcas = filteredVcas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

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
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1 pb-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate w-full mb-1">{label}</span>
                  <div className="flex flex-col w-full gap-1">
                    {["all", "yes", "no"].map((option) => {
                      const isActive = subPopulationFilters[key] === option;
                      return (
                        <div
                          key={option}
                          onClick={() => handleFilterChange(key, option)}
                          className={cn(
                            "w-full px-2 py-1.5 text-[10px] uppercase tracking-wide font-medium text-center rounded-md cursor-pointer transition-all duration-200 border",
                            isActive
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                          )}
                        >
                          {option}
                        </div>
                      )
                    })}
                  </div>
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
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead className="w-[180px]">VCA Name</TableHead>
                  <TableHead className="w-[80px] hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="w-[60px] hidden sm:table-cell">Age</TableHead>
                  <TableHead className="min-w-[200px] hidden lg:table-cell">Household Details</TableHead>
                  <TableHead className="text-right w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vcasQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <TableSkeleton rows={8} columns={6} />
                    </TableCell>
                  </TableRow>
                ) : filteredVcas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      No VCAs found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVcas.map((vca: any, index: number) => {
                    const id = pickValue(vca, ["uid", "unique_id", "vca_id"]);
                    return (
                      <TableRow key={`${id}-${index}`}>
                        <TableCell className="font-medium align-top hidden sm:table-cell">
                          <span className="text-[10px] sm:text-xs">{String(id)}</span>
                        </TableCell>
                        <TableCell className="align-top px-2 sm:px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 sm:hidden">
                              <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{String(id)}</span>
                            </div>
                            <span className="font-medium text-slate-900 leading-tight truncate max-w-[150px] sm:max-w-none">
                              {String(pickValue(vca, ["firstname", "name"]))} {String(pickValue(vca, ["lastname"]))}
                            </span>
                            <div className="mt-1 flex gap-2 sm:hidden">
                              <span className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 rounded text-slate-600">
                                {String(pickValue(vca, ["vca_gender", "gender"]))?.charAt(0)} • {calculateAge(vca.birthdate)}y
                              </span>
                            </div>
                            <div className="mt-1 flex flex-col sm:hidden lg:hidden">
                              <span className="text-[10px] text-slate-500 italic truncate max-w-[140px]">
                                {vca.facility || "No Facility"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell align-top">
                          {String(pickValue(vca, ["vca_gender", "gender"]))}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell align-top">
                          {calculateAge(vca.birthdate)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="whitespace-pre-line text-xs text-slate-600 leading-snug">
                            {getAddressString(vca)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top px-2 sm:px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                            onClick={() => navigate(`/profile/vca-details`, { state: { id: String(id) } })}
                          >
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

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t">
            <div className="text-sm text-slate-500">
              Showing {filteredVcas.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredVcas.length)} of{" "}
              {filteredVcas.length} entries
            </div>

            {totalPages > 1 && (
              <Pagination className="justify-end w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, i) => (
                    <PaginationItem key={i}>
                      {page === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => setCurrentPage(page as number)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </GlowCard>
    </DashboardLayout>
  );
};

export default VcaRegister;

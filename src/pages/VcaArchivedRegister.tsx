import { useState, useMemo, useEffect } from "react";
import { Archive, Search, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_DISTRICT, getChildrenArchivedRegister } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";


const ITEMS_PER_PAGE = 50;

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

const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
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
  const navigate = useNavigate();
  const district = user?.location ?? DEFAULT_DISTRICT;

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );
  const [graduationFilter, setGraduationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subPopulationFilters, graduationFilter]);

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
    setGraduationFilter("all");
    setCurrentPage(1);
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
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead className="w-[150px]">VCA Name</TableHead>
                  <TableHead className="w-[80px] hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="w-[60px] hidden sm:table-cell">Age</TableHead>
                  <TableHead className="min-w-[200px] hidden lg:table-cell">Household Details</TableHead>
                  <TableHead className="w-[100px] hidden md:table-cell">Archived</TableHead>
                  <TableHead className="w-[120px] hidden lg:table-cell">Reason</TableHead>
                  <TableHead className="text-right w-[60px]">Action</TableHead>
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
                    <TableCell colSpan={8} className="p-0">
                      <TableSkeleton rows={6} columns={6} />
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
                {paginatedVcas.map((vca: any, index: number) => {
                  const id = pickValue(vca, ["vca_id", "vcaid", "id", "unique_id", "child_id", "uid"]);
                  const fullName = `${vca.firstname || ''} ${vca.lastname || ''}`.trim();
                  const age = calculateAge(vca.birthdate);

                  return (
                    <TableRow key={`${String(id)}-${index}`}>
                      <TableCell className="font-medium align-top hidden sm:table-cell">
                        <span className="text-xs">{String(id)}</span>
                      </TableCell>
                      <TableCell className="font-medium align-top px-2 sm:px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 sm:hidden">
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{String(id)}</span>
                          </div>
                          <span className="text-sm leading-tight">{fullName || 'N/A'}</span>
                          <div className="mt-1 flex gap-2 sm:hidden">
                            <span className="text-[10px] bg-slate-50 border border-slate-100 px-1.5 rounded text-slate-600">
                              {vca.vca_gender?.charAt(0) || '?'} • {age}y
                            </span>
                          </div>
                          <div className="mt-1 flex flex-col gap-1 sm:hidden">
                            <span className="text-[10px] text-slate-500 italic">
                              Archived: {String(pickValue(vca, ["archived_on", "archivedOn", "date_archived", "de_registration_date", "updated_at"]))}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-top">{vca.vca_gender || 'N/A'}</TableCell>
                      <TableCell className="hidden sm:table-cell align-top">{age}</TableCell>
                      <TableCell className="hidden lg:table-cell align-top">
                        <div className="whitespace-pre-line text-[10px] text-slate-600 leading-snug">
                          {getAddressString(vca)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-top text-xs">
                        {String(pickValue(vca, ["archived_on", "archivedOn", "date_archived", "de_registration_date", "updated_at"]))}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell align-top text-xs">
                        <span className="text-amber-700">
                          {String(pickValue(vca, ["reason", "archived_reason", "status", "case_status"]))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right align-top px-2 sm:px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs border-slate-200"
                          onClick={() => navigate(`/profile/vca-profile/${encodeURIComponent(String(id))}`)}
                        >
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

export default VcaArchivedRegister;

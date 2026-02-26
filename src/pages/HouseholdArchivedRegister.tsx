import { useState, useMemo, useEffect } from "react";
import { Archive, Search, Filter, Download } from "lucide-react";
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
import { toTitleCase } from "@/lib/utils";
import { DEFAULT_DISTRICT, getHouseholdArchivedRegister, getHouseholdsByDistrict } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SubPopulationFilter } from "@/components/dashboard/SubPopulationFilter";


const ITEMS_PER_PAGE = 50;

const subPopulationFilterLabels = {
  calhiv: 'CALHIV',
  hei: 'HEI',
  cwlhiv: 'CWLHIV',
  agyw: 'AGYW',
  csv: 'C/SV',
  cfsw: 'CFSW',
  abym: 'ABYM'
};

const filterKeyToDataKey: Record<string, string> = {};

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

const HouseholdArchivedRegister = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initialDistrict = user?.location || DEFAULT_DISTRICT;
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

  // Discover districts — same pattern as Districts Coverage page
  const hhListQuery = useQuery({
    queryKey: ["districts-discovery", "All"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30,
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (hhListQuery.data) {
      (hhListQuery.data as any[]).forEach((h: any) => {
        const raw = h.district;
        if (raw) {
          const normalized = toTitleCase(raw.trim());
          if (!groups.has(normalized)) groups.set(normalized, []);
          const variants = groups.get(normalized)!;
          if (!variants.includes(raw)) variants.push(raw);
        }
      });
    }
    return groups;
  }, [hhListQuery.data]);

  const districts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );
  const [graduationFilter, setGraduationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const archivedQuery = useQuery({
    queryKey: ["households", "archived", "All", graduationFilter], // Fetch all for local filtering
    queryFn: () =>
      getHouseholdArchivedRegister("", {
        de_registration_reason: graduationFilter === "all" ? undefined : graduationFilter,
      }),
    staleTime: 1000 * 60 * 10,
  });

  const archivedHouseholds = useMemo(() => archivedQuery.data ?? [], [archivedQuery.data]);

  const filteredHouseholds = useMemo(() => {
    const allArchived = archivedQuery.data ?? [];
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    return allArchived.filter((household: any) => {
      const sDist = String(household.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDist)) return false;

      // Global Search
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch = searchQuery
        ? (household.household_id?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.homeaddress?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.ward?.toLowerCase() || "").includes(lowerCaseQuery) ||
        (household.caseworker_name?.toLowerCase() || "").includes(lowerCaseQuery)
        : true;

      // Sub-population Filters
      const matchesFilters = Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;

        let dataKey = key;
        if (key in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[key];
        }

        const recordValue = household[dataKey];
        // Check for '1', 'true', '0', 'false' string or boolean values
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });

      return matchesSearch && matchesFilters;
    });
  }, [archivedHouseholds, searchQuery, subPopulationFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subPopulationFilters, graduationFilter]);

  const totalPages = Math.ceil(filteredHouseholds.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHouseholds = filteredHouseholds.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    if (filteredHouseholds.length === 0) return;

    try {
      const headers = [
        "Household ID",
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
              return pickValue(row, ["de_registration_reason", "reason", "archived_reason", "case_status", "status"]);
            }
            if (key === 'archived_on') {
              return pickValue(row, ["de_registration_date", "archived_on", "archivedOn", "date_archived", "updated_at"]);
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
      link.download = `archived_households_${selectedDistrict}.csv`;
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
      <GlowCard>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-primary" />
              <CardTitle>Archived Households</CardTitle>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-200 text-slate-600 hover:text-primary transition-all"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />
              <span className="text-xs font-black text-slate-400 whitespace-nowrap">District:</span>
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                disabled={user?.description === "District User"}
              >
                <SelectTrigger className="w-[180px] bg-slate-50 border-none font-bold h-9">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 text-sm text-amber-600 font-medium">
            Note: Only deregistered caregivers are shown.
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="space-y-6">
            {/* Sub-population Filters */}
            <SubPopulationFilter
              filters={subPopulationFilters}
              labels={subPopulationFilterLabels}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />

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
                  <TableHead className="w-[120px] hidden sm:table-cell">Hh id</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell">Household details</TableHead>
                  <TableHead className="w-[120px] hidden lg:table-cell">Archived on</TableHead>
                  <TableHead className="w-[150px] hidden md:table-cell">Reason</TableHead>
                  <TableHead className="text-right w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedDistrict && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                      Set `VITE_DEFAULT_DISTRICT` to load archived households.
                    </TableCell>
                  </TableRow>
                )}
                {archivedQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <TableSkeleton rows={6} columns={5} />
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
                {paginatedHouseholds.map((household: any, index: number) => {
                  const id = pickValue(household, ["household_id", "householdId", "hh_id", "id", "unique_id"]);
                  return (
                    <TableRow key={`${String(id)}-${index}`}>
                      <TableCell className="font-medium align-top hidden sm:table-cell">
                        <span className="text-sm font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">{String(id)}</span>
                      </TableCell>
                      <TableCell className="sm:hidden">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1 rounded w-fit">{String(id)}</span>
                          <span className="text-[10px] text-slate-500 italic">
                            Archived: {String(pickValue(household, ["de_registration_date", "archived_on", "archivedOn", "date_archived", "updated_at"]))}
                          </span>
                          <span className="text-[10px] text-amber-600 font-medium truncate max-w-[140px]">
                            {String(pickValue(household, ["de_registration_reason", "reason", "archived_reason", "case_status", "status"]))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell align-top">
                        <div className="whitespace-pre-line text-[10px] text-slate-600 leading-snug">
                          {getAddressString(household)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell align-top text-xs">
                        {String(pickValue(household, ["de_registration_date", "archived_on", "archivedOn", "date_archived", "updated_at"]))}
                      </TableCell>
                      <TableCell className="hidden md:table-cell align-top text-xs">
                        <span className="text-amber-700">
                          {String(pickValue(household, ["de_registration_reason", "reason", "archived_reason", "case_status", "status"]))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right align-top px-2 sm:px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs border-slate-200"
                          onClick={() => navigate(`/profile/household-details`, { state: { id: String(id) } })}
                        >
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t">
            <div className="text-sm text-slate-500">
              Showing {filteredHouseholds.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredHouseholds.length)} of{" "}
              {filteredHouseholds.length} entries
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

export default HouseholdArchivedRegister;

import { useState, useMemo, useEffect } from "react";
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
import { DEFAULT_DISTRICT, getHouseholdsByDistrict } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";


const ITEMS_PER_PAGE = 50;

const subPopulationFilterLabels = {
  calhiv: "CALHIV",
  hei: "HEI",
  cwlhiv: "CWLHIV",
  agyw: "AGYW",
  csv: "C/SV",
  cfsw: "CFSW",
  abym: "ABYM",
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

const HouseholdRegister = () => {
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subPopulationFilters]);

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
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {Object.entries(subPopulationFilterLabels).map(([key, label]) => (
                <div key={key} className="flex flex-col items-start gap-1">
                  <span className="text-[10px] text-slate-500 font-medium truncate w-full">{label}</span>
                  <Select
                    value={subPopulationFilters[key]}
                    onValueChange={(val) => handleFilterChange(key, val)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
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
                  <TableHead className="w-[100px] hidden sm:table-cell">HH ID</TableHead>
                  <TableHead className="w-[200px]">Caregiver</TableHead>
                  <TableHead className="min-w-[200px] hidden sm:table-cell">Household Details</TableHead>
                  <TableHead className="w-[150px] hidden lg:table-cell">Case Worker</TableHead>
                  <TableHead className="text-right w-[60px]">Action</TableHead>
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
                  paginatedHouseholds.map((household: any, index: number) => {
                    const id = pickValue(household, ["household_id", "householdId"]);
                    return (
                      <TableRow key={`${id}-${index}`}>
                        <TableCell className="font-medium align-top hidden sm:table-cell">
                          <span className="text-xs sm:text-sm">{String(id)}</span>
                        </TableCell>
                        <TableCell className="align-top px-2 sm:px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 sm:hidden">
                              <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{String(id)}</span>
                            </div>
                            <span className="font-medium text-slate-900 truncate max-w-[150px] sm:max-w-none">
                              {String(pickValue(household, ["caregiver_name", "name"]))}
                            </span>
                            <div className="mt-1 flex flex-col gap-0.5 sm:hidden">
                              <span className="text-[10px] text-slate-500 italic truncate max-w-[140px]">
                                {household.facility || "No Facility"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                CW: {String(pickValue(household, ["caseworker_name", "cwac_member_name"]))}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="whitespace-pre-line text-xs text-slate-600 leading-snug">
                            {getAddressString(household)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-top text-xs">
                          {String(pickValue(household, ["caseworker_name", "cwac_member_name"]))}
                        </TableCell>
                        <TableCell className="text-right align-top px-2 sm:px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                            onClick={() => navigate(`/profile/household-profile/${encodeURIComponent(String(id))}`)}
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

export default HouseholdRegister;

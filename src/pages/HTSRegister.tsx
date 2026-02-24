import { useState, useMemo, useEffect } from "react";
import { Search, TestTube2, ChevronRight, RefreshCcw, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getHTSRegisterByDistrict, getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { downloadCsv } from "@/lib/exportUtils";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/utils";

const ITEMS_PER_PAGE = 50;

const pickVal = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const val = record[key];
    if (val !== null && val !== undefined && val !== "") return String(val);
  }
  return "—";
};

// All fields from backend
const PROFILE_FIELDS: { label: string; keys: string[] }[] = [
  { label: "Case ID", keys: ["client_number", "ecap_id"] },
  { label: "Case Number", keys: ["client_number"] },
  { label: "ECAP ID", keys: ["ecap_id"] },
  { label: "ART Number", keys: ["case_art_number"] },
  { label: "Individual Tested ID", keys: ["ecap_id", "client_number"] },
  { label: "Age (Index/SNS)", keys: ["age_index_sns"] },
  { label: "Individual Age", keys: ["individual_age"] },
  { label: "Gender (Case)", keys: ["gender_case"] },
  { label: "Gender (Linked)", keys: ["gender_link"] },
  { label: "Sub Population", keys: ["sub_population"] },
  { label: "Case Sub-Population", keys: ["case_suppopulation"] },
  { label: "HIV Status", keys: ["hiv_status"] },
  { label: "HIV Result", keys: ["hiv_result"] },
  { label: "Recent HIV Test", keys: ["hiv_recent_test"] },
  { label: "Date Tested (Contact)", keys: ["date_tested_contact"] },
  { label: "Date Tested (Link)", keys: ["date_tested_link"] },
  { label: "ART Date", keys: ["art_date"] },
  { label: "ART Date Initiated", keys: ["art_date_initiated"] },
  { label: "Relationship", keys: ["relationship"] },
  { label: "Other Relationship", keys: ["other_relationship"] },
  { label: "Testing Modality", keys: ["testing_modality"] },
  { label: "Entry Point", keys: ["entry_point"] },
  { label: "Test Done at HF", keys: ["test_done_hf"] },
  { label: "Health Facility", keys: ["health_facility"] },
  { label: "Link Event ID", keys: ["link_event_id"] },
  { label: "Caseworker", keys: ["caseworker_name"] },
  { label: "Address", keys: ["address"] },
  { label: "Landmark", keys: ["landmark"] },
  { label: "Phone", keys: ["phone"] },
  { label: "Contact Phone", keys: ["contact_phone"] },
  { label: "Province", keys: ["province"] },
  { label: "District", keys: ["district"] },
  { label: "Date Created", keys: ["date_created"] },
  { label: "Comment", keys: ["comment"] },
];

const HTSRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initial state logic for district security
  const initialDistrict = (user?.description === "District User" && user?.location)
    ? user.location
    : "All";

  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

  // Discover districts — same pattern as Districts Coverage page
  const dashboardDistrict = user?.location || "All";
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", dashboardDistrict],
    queryFn: () => getHouseholdsByDistrict(dashboardDistrict === "All" ? "" : dashboardDistrict),
    staleTime: 1000 * 60 * 5,
  });

  const discoveredDistrictsMap = useMemo(() => {
    const groups = new Map<string, string[]>();
    if (householdsListQuery.data) {
      (householdsListQuery.data as any[]).forEach((h: any) => {
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
  }, [householdsListQuery.data]);

  const discoveredDistricts = useMemo(() => {
    return Array.from(discoveredDistrictsMap.keys()).sort();
  }, [discoveredDistrictsMap]);

  // HTS data query — always fetch all for robust local filtering by variants
  const htsQuery = useQuery({
    queryKey: ["hts-register", "All"],
    queryFn: () => getHTSRegisterByDistrict("*"),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });

  // PERSISTENCE: Restore previous nationwide counts
  const [cachedNationwideStats, setCachedNationwideStats] = useState<any>(() => {
    const saved = localStorage.getItem("ecap_cache_nationwide_hts");
    return saved ? JSON.parse(saved) : null;
  });

  const allRecords = useMemo(() => {
    const rawData = (htsQuery.data ?? []) as any[];
    if (selectedDistrict === "All") return rawData;

    const selectedVariants = discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict];
    return rawData.filter(r => {
      const rDist = String(r.district || "");
      return selectedVariants.includes(rDist);
    });
  }, [htsQuery.data, selectedDistrict, discoveredDistrictsMap]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return allRecords;
    const q = searchQuery.toLowerCase();
    const searchableFields = [
      "client_number", "ecap_id", "case_art_number",
      "district", "health_facility", "caseworker_name"
    ];
    return allRecords.filter((r: any) =>
      searchableFields.some((key) => r[key] != null && String(r[key]).toLowerCase().includes(q))
    );
  }, [allRecords, searchQuery]);

  const dashboardStats = useMemo(() => {
    if (!allRecords.length) return null;
    const pos = allRecords.filter(r => {
      const res = String(r.hiv_result || r.hiv_status || "").toLowerCase();
      return res.includes("positive") || res.includes("reactive");
    }).length;

    const result = {
      total: allRecords.length,
      positives: pos,
      positivityRate: Math.round((pos / allRecords.length) * 100) || 0
    };

    if (selectedDistrict === "All" && result.total > 0) {
      localStorage.setItem("ecap_cache_nationwide_hts", JSON.stringify(result));
    }
    return result;
  }, [allRecords, selectedDistrict]);

  const displayStats = selectedDistrict === "All" ? (dashboardStats || cachedNationwideStats) : dashboardStats;
  const isRefreshing = htsQuery.isFetching && displayStats?.total > 0;

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDistrict]);

  // CSV Export
  const handleExportCsv = () => {
    try {
      if (filteredRecords.length === 0) {
        toast.error("No records to export.");
        return;
      }
      const headers = PROFILE_FIELDS.map((f) => f.label);
      const rows = filteredRecords.map((r: any) =>
        PROFILE_FIELDS.map((f) => pickVal(r, f.keys))
      );
      const dateStr = new Date().toISOString().slice(0, 10);
      const districtLabel = selectedDistrict === "All" ? "all_districts" : selectedDistrict.replace(/\s+/g, "_");
      downloadCsv(headers, rows, `hts_register_${districtLabel}_${dateStr}.csv`);
      toast.success(`Exported ${filteredRecords.length} records successfully.`);
    } catch (err) {
      console.error("HTS export error:", err);
      toast.error("Failed to export CSV.");
    }
  };

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const getHIVResultBadge = (record: any) => {
    const result = String(record.hiv_result || record.hiv_status || "").toLowerCase();
    if (result.includes("positive") || result.includes("reactive")) {
      return <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">Positive</Badge>;
    }
    if (result.includes("negative") || result.includes("non-reactive")) {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Negative</Badge>;
    }
    return <Badge variant="outline" className="text-slate-400 text-[10px]">{record.hiv_result || "Unknown"}</Badge>;
  };

  return (
    <DashboardLayout subtitle="HTS Register">
      <PageIntro
        eyebrow="HTS Tracking"
        title="HTS Register"
        description={`Showing ${filteredRecords.length} record${filteredRecords.length !== 1 ? "s" : ""} for ${selectedDistrict || "..."}.`}
      />

      <GlowCard>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>HIV Testing Services Register</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Total Records: <span className="text-slate-900">{displayStats?.total || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Positives: <span className="text-slate-900">{displayStats?.positives || 0}</span>
                </div>
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-emerald-600 animate-pulse ml-4 lowercase font-bold tracking-normal italic">
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                    <span>Syncing records...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* District Dropdown — same fetch pattern as Districts Coverage */}
              <Select
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                disabled={user?.description === "District User"}
              >
                <SelectTrigger className="w-[180px] border-slate-200 font-medium h-9">
                  <SelectValue placeholder={householdsListQuery.isLoading ? "Loading..." : "Select District"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Districts</SelectItem>
                  {discoveredDistricts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Global search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-slate-600 whitespace-nowrap"
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-md border mx-6 mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell w-[120px]">Case/VCA ID</TableHead>
                  <TableHead>Test Details</TableHead>
                  <TableHead className="hidden md:table-cell">HIV Result</TableHead>
                  <TableHead className="hidden lg:table-cell">Modality</TableHead>
                  <TableHead className="hidden lg:table-cell">Caseworker</TableHead>
                  <TableHead className="text-right w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {htsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <TableSkeleton rows={8} columns={6} />
                    </TableCell>
                  </TableRow>
                ) : !selectedDistrict ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <TestTube2 className="h-8 w-8 opacity-20" />
                        <span className="text-sm font-medium">Select a district to load records</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-slate-500">
                      No HTS records found for {selectedDistrict}.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((r: any, idx: number) => (
                    <TableRow key={idx} className="group hover:bg-slate-50">
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 italic">
                          {pickVal(r, ["ecap_id", "client_number"])}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm sm:hidden bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit mb-1">
                            {pickVal(r, ["ecap_id", "client_number"])}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] text-slate-400 font-normal">
                              {pickVal(r, ["individual_age"])}y • {pickVal(r, ["gender_case", "gender_link"])}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getHIVResultBadge(r)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                        {pickVal(r, ["testing_modality"])}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                        {pickVal(r, ["caseworker_name"])}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] sm:h-8 sm:px-3 sm:text-xs"
                          onClick={() => navigate("/profile/hts-details", { state: { record: r } })}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 pb-6 pt-2 border-t">
            <div className="text-sm text-slate-500">
              Showing {filteredRecords.length > 0 ? startIndex + 1 : 0}
              {" "}to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRecords.length)}
              {" "}of {filteredRecords.length} entries
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
                      {page === "..." ? (
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

export default HTSRegister;

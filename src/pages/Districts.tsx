import { MapPin, Home, Users, Download, ArrowRight, RefreshCw, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingDots from "@/components/aceternity/LoadingDots";
import TableSkeleton from "@/components/ui/TableSkeleton";
import AnimatedCounter from "@/components/AnimatedCounter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getTotalHouseholdsCount,
  getTotalVcasCount,
  getTotalMothersCount,
  getHouseholdsByDistrict,
  getChildrenByDistrict,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { cn, toTitleCase } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import { downloadCsv } from "@/lib/exportUtils";
import { toast } from "sonner";





const Districts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ... (Keep existing queries and logic: dashboardDistrict, kpi queries, discovery logic, etc.) ...
  const dashboardDistrict = user?.location || "All";

  // --- KPI Queries ---
  const householdCountQuery = useQuery({
    queryKey: ["kpi", "households", dashboardDistrict],
    queryFn: () => getTotalHouseholdsCount(dashboardDistrict),
  });

  const vcaCountQuery = useQuery({
    queryKey: ["kpi", "vcas", dashboardDistrict],
    queryFn: () => getTotalVcasCount(dashboardDistrict),
  });

  // --- District List Discovery ---
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", dashboardDistrict],
    queryFn: () => getHouseholdsByDistrict(dashboardDistrict === "All" ? "" : dashboardDistrict),
    staleTime: 1000 * 60 * 5,
  });

  const discoveredDistrictsMap = useMemo(() => {
    if (!householdsListQuery.data) return new Map<string, string[]>();

    const groups = new Map<string, string[]>();
    householdsListQuery.data.forEach((household: any) => {
      const raw = household.district;
      if (raw) {
        const normalized = toTitleCase(raw.trim());
        if (!groups.has(normalized)) {
          groups.set(normalized, []);
        }
        const variants = groups.get(normalized)!;
        if (!variants.includes(raw)) {
          variants.push(raw);
        }
      }
    });
    return groups;
  }, [householdsListQuery.data]);

  const targetDistrictsNormalized = useMemo(() => {
    const sorted = Array.from(discoveredDistrictsMap.keys()).sort();
    if (sorted.length > 0) return sorted;
    if (dashboardDistrict !== "All") return [dashboardDistrict];
    return [];
  }, [discoveredDistrictsMap, dashboardDistrict]);

  // --- District Stats Queries ---
  const districtQueries = useQueries({
    queries: targetDistrictsNormalized.map((normalizedName) => ({
      queryKey: ["district-stats-v2", normalizedName, discoveredDistrictsMap.get(normalizedName)],
      queryFn: async () => {
        const variants = discoveredDistrictsMap.get(normalizedName) || [normalizedName];

        // Fetch for all variants and sum them up
        const results = await Promise.all(variants.map(async (v) => {
          const [households, vcas] = await Promise.all([
            getTotalHouseholdsCount(v),
            getTotalVcasCount(v),
          ]);
          return { households: Number(households) || 0, vcas: Number(vcas) || 0 };
        }));

        const totalHouseholds = results.reduce((sum, r) => sum + r.households, 0);
        const totalVcas = results.reduce((sum, r) => sum + r.vcas, 0);

        return {
          district: normalizedName,
          households: totalHouseholds,
          vcas: totalVcas,
          variants, // Keep track for debugging or detailed exports
        };
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isDiscoveryLoading = householdsListQuery.isLoading;

  // Determine if any query is currently fetching (even if it has data)
  const isSyncing =
    householdCountQuery.isFetching ||
    vcaCountQuery.isFetching ||
    householdsListQuery.isFetching ||
    districtQueries.some(q => q.isFetching);

  const areDistrictsLoading = districtQueries.some((q) => q.isLoading) || isDiscoveryLoading;
  const districtData = districtQueries
    .map((q) => q.data)
    .filter(Boolean)
    // Extra guard to ensure final list is unique by name just in case
    .filter((v, i, a) => a.findIndex(t => t?.district === v?.district) === i);

  const formatCount = (value: unknown) => {
    if (value === null || value === undefined) return "0";
    const num = Number(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-GB").format(num);
  };

  const handleExportSummary = () => {
    try {
      if (districtData.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const headers = ["District", "Households", "VCAs"];
      const rows = districtData.map((data: any) => [
        data.district,
        String(data.households || 0),
        String(data.vcas || 0),
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `districts_summary_${dateStr}.csv`;

      downloadCsv(headers, rows, filename);
      toast.success("Summary exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export summary");
    }
  };




  const [exportingDistrict, setExportingDistrict] = useState<string | null>(null);

  const handleExportDistrictDetails = async (districtName: string) => {
    try {
      setExportingDistrict(districtName);
      toast.info(`Preparing detailed export for ${districtName}...`);

      const normalizedData = districtData.find(d => d?.district === districtName);
      const variants = normalizedData?.variants || [districtName];

      // Fetch households for all variants
      const allHouseholdsResults = await Promise.all(
        variants.map(v => getHouseholdsByDistrict(v))
      );

      const households = allHouseholdsResults.flat();

      if (!households || households.length === 0) {
        toast.error(`No household data found for ${districtName}`);
        setExportingDistrict(null);
        return;
      }

      // Define headers for the detailed CSV
      const headers = [
        "Household ID",
        "Caregiver Name",
        "District",
        "Ward",
        "Community",
        "Date Enrolled",
        "Case Status",
        "Vulnerability Status",
        "Total Members",
        "Last Service Date"
      ];

      // Map data to rows
      const rows = households.map((h: any) => [
        String(h.household_id || h.householdId || h.hh_id || ""),
        String(h.caregiver_name || h.name || ""),
        String(h.district || ""),
        String(h.ward || ""),
        String(h.community || h.village || ""),
        String(h.date_enrolled || h.enrollment_date || ""),
        String(h.case_status || h.status || "Active"),
        String(h.vulnerability_status || ""),
        String(h.total_members || h.members_count || "0"),
        String(h.last_service_date || "")
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `${districtName}_detailed_report_${dateStr}.csv`;

      downloadCsv(headers, rows, filename);
      toast.success(`${districtName} detailed report exported successfully`);
    } catch (error) {
      console.error("Detailed export error:", error);
      toast.error(`Failed to export data for ${districtName}`);
    } finally {
      setExportingDistrict(null);
    }
  };

  return (
    <DashboardLayout subtitle="Districts">
      {/* ... (Keep PageIntro and KPI Cards same as before) ... */}
      <PageIntro
        eyebrow="Districts"
        title="District-level readiness at a glance."
        description="Compare screening coverage, open household caseloads, and service follow-ups."
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded-full border-0 font-medium">
              Live Coverage
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={handleExportSummary}
              disabled={districtData.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Summary
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <KpiCard
          title="Households Screened"
          value={formatCount(householdCountQuery.data)}
          caption={dashboardDistrict === "All" ? "All households" : `${dashboardDistrict} households`}
          isLoading={householdCountQuery.isFetching}
          icon={<Home className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconText="text-emerald-600"
          borderAccent="border-l-4 border-l-emerald-500"
          hoverable
        />
        <KpiCard
          title="Total VCAs Screened"
          value={formatCount(vcaCountQuery.data)}
          caption={dashboardDistrict === "All" ? "All registered children" : `${dashboardDistrict} children`}
          isLoading={vcaCountQuery.isFetching}
          delay={0.1}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconText="text-amber-600"
          borderAccent="border-l-4 border-l-amber-500"
          hoverable
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* ... Header ... */}
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">District Coverage</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2 transition-all disabled:opacity-50"
            onClick={() => {
              // Invalidate all related queries to trigger a fresh background fetch
              queryClient.invalidateQueries({ queryKey: ["kpi"] });
              queryClient.invalidateQueries({ queryKey: ["districts-discovery"] });
              queryClient.invalidateQueries({ queryKey: ["district-stats"] });
            }}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Districts"}
          </Button>
        </div>

        <GlowCard className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px] hidden md:table-cell">No.</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="hidden sm:table-cell">Households</TableHead>
                  <TableHead className="hidden sm:table-cell">VCAs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areDistrictsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <TableSkeleton rows={6} columns={4} />
                    </TableCell>
                  </TableRow>
                ) : districtData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState icon={<MapPin className="h-7 w-7" />} title="No District Data" description="No district data is available yet. Try syncing." />
                    </TableCell>
                  </TableRow>
                ) : (
                  districtData.map((data: any, index) => (
                    <TableRow key={data.district} className="group transition-colors hover:bg-muted/30">
                      <TableCell className="font-medium text-muted-foreground hidden md:table-cell">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex flex-col">
                          <span>{data.district}</span>
                          <div className="flex gap-2 mt-1 sm:hidden">
                            <span className="text-[10px] text-muted-foreground">HHs: {formatCount(data.households)}</span>
                            <span className="text-[10px] text-muted-foreground">VCAs: {formatCount(data.vcas)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCount(data.households)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCount(data.vcas)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleExportDistrictDetails(data.district)}
                            disabled={exportingDistrict === data.district}
                            title="Export Detailed Report"
                          >
                            {exportingDistrict === data.district ? (
                              <LoadingDots className="text-emerald-500 scale-50" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                            onClick={() => navigate(`/households?district=${encodeURIComponent(data.district)}`)}
                          >
                            Explore <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

// ... KpiCard component ...

// Internal Component for KPI Cards
const KpiCard = ({ title, value, caption, isLoading, delay = 0, icon, iconBg, iconText, borderAccent, hoverable }: { title: string, value: string, caption: string, isLoading: boolean, delay?: number, icon?: React.ReactNode, iconBg?: string, iconText?: string, borderAccent?: string, hoverable?: boolean }) => {
  return (
    <div style={{ animationDelay: `${delay}s` }} className="h-full">
      <GlowCard hoverable={hoverable} className={cn("flex flex-col justify-between py-6 px-6 h-full", borderAccent)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              {isLoading ? <LoadingDots className="text-slate-400" /> : <AnimatedCounter value={value} />}
            </div>
          </div>
          {icon && (
            <div className={cn("rounded-lg p-2", iconBg, iconText)}>
              {icon}
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
            {caption}
          </p>
        </div>
      </GlowCard>
    </div>
  );
};

export default Districts;


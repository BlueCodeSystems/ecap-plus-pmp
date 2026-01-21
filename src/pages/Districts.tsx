import { MapPin, Home, Users, Download, ArrowRight, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  getTotalHouseholdsCount,
  getTotalVcasCount,
  getTotalMothersCount,
  getHouseholdsByDistrict,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const Districts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the same fallback as MetricsGrid on the home page
  // If user location is not set, we default to "All" (or empty string if preferred, 
  // but "All" matches the home page logs)
  const dashboardDistrict = user?.location || "All";

  // --- KPI Queries ---
  // We use the exact same count functions as MetricsGrid
  const householdCountQuery = useQuery({
    queryKey: ["kpi", "households", dashboardDistrict],
    queryFn: () => getTotalHouseholdsCount(dashboardDistrict),
  });

  const vcaCountQuery = useQuery({
    queryKey: ["kpi", "vcas", dashboardDistrict],
    queryFn: () => getTotalVcasCount(dashboardDistrict),
  });

  const mothersCountQuery = useQuery({
    queryKey: ["kpi", "mothers", dashboardDistrict],
    queryFn: () => getTotalMothersCount(dashboardDistrict),
  });

  // --- District List Discovery ---
  // Fetch households to extract unique districts for the table
  // Passing "" to getHouseholdsByDistrict results in /household/all-households
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", dashboardDistrict],
    queryFn: () => getHouseholdsByDistrict(dashboardDistrict === "All" ? "" : dashboardDistrict),
    staleTime: 1000 * 60 * 5,
  });

  // Extract unique districts from the households data
  const discoveredDistricts = useMemo(() => {
    if (!householdsListQuery.data) return [];
    const districts = new Set<string>();
    householdsListQuery.data.forEach((household: any) => {
      if (household.district) {
        districts.add(household.district);
      }
    });
    return Array.from(districts).sort();
  }, [householdsListQuery.data]);

  // Use the discovered list for the table rows
  const targetDistricts = discoveredDistricts.length > 0
    ? discoveredDistricts
    : dashboardDistrict !== "All" ? [dashboardDistrict] : [];

  // --- District Stats Queries ---
  // Fetch specific counts for each valid district row in the table
  const districtQueries = useQueries({
    queries: targetDistricts.map((districtName) => ({
      queryKey: ["district-stats", districtName],
      queryFn: async () => {
        const [households, vcas] = await Promise.all([
          getTotalHouseholdsCount(districtName),
          getTotalVcasCount(districtName),
        ]);
        return {
          district: districtName,
          households,
          vcas,
        };
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isDiscoveryLoading = householdsListQuery.isLoading;
  const areDistrictsLoading = districtQueries.some((q) => q.isLoading) || isDiscoveryLoading;
  const districtData = districtQueries.map((q) => q.data).filter(Boolean);

  const formatCount = (value: unknown) => {
    if (value === null || value === undefined) return "0";
    const num = Number(value);
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat("en-GB").format(num);
  };

  const handleExportSummary = () => {
    if (districtData.length === 0) return;

    try {
      const headers = ["No.", "District", "Households Screened", "VCAs Screened"];
      const csvRows = districtData.map((data: any, index: number) => [
        index + 1,
        data.district,
        data.households,
        data.vcas,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `districts_summary_${dashboardDistrict.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting district summary:", error);
    }
  };

  return (
    <DashboardLayout subtitle="Districts">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Households Screened"
          value={formatCount(householdCountQuery.data)}
          caption={dashboardDistrict === "All" ? "All households" : `${dashboardDistrict} households`}
          isLoading={householdCountQuery.isLoading}
        />
        <KpiCard
          title="Total VCAs Screened"
          value={formatCount(vcaCountQuery.data)}
          caption={dashboardDistrict === "All" ? "All registered children" : `${dashboardDistrict} children`}
          isLoading={vcaCountQuery.isLoading}
          delay={0.1}
        />
        <KpiCard
          title="Total Index Mothers Registered"
          value={formatCount(mothersCountQuery.data)}
          caption={dashboardDistrict === "All" ? "All index mothers" : `${dashboardDistrict} index mothers`}
          isLoading={mothersCountQuery.isLoading}
          delay={0.2}
        />
      </div>

      {/* District Coverage Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">District Coverage</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => {
              householdsListQuery.refetch();
              districtQueries.forEach(q => q.refetch());
              householdCountQuery.refetch();
              vcaCountQuery.refetch();
              mothersCountQuery.refetch();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </Button>
        </div>

        <GlowCard className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px]">No.</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Households</TableHead>
                  <TableHead>VCAs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areDistrictsLoading && districtData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <LoadingDots />
                        <span className="text-xs">
                          {isDiscoveryLoading ? "Discovering districts..." : "Loading district data..."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : districtData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No district data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  districtData.map((data: any, index) => (
                    <TableRow key={data.district} className="group">
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">{data.district}</TableCell>
                      <TableCell>{formatCount(data.households)}</TableCell>
                      <TableCell>{formatCount(data.vcas)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-pink-600 hover:text-pink-700 p-0 text-right font-medium"
                          onClick={() => navigate("/households")}
                        >
                          View Records
                          <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
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

// Internal Component for KPI Cards
const KpiCard = ({ title, value, caption, isLoading, delay = 0 }: { title: string, value: string, caption: string, isLoading: boolean, delay?: number }) => {
  return (
    <div style={{ animationDelay: `${delay}s` }} className="h-full">
      <GlowCard className="flex flex-col justify-between py-6 px-6 h-full">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          <div className="text-3xl font-bold text-foreground tracking-tight">
            {isLoading ? <LoadingDots className="text-slate-400" /> : value}
          </div>
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


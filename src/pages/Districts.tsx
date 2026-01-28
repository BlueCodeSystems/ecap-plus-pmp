import { MapPin, Home, Users, Download, ArrowRight, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getChildrenByDistrict,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";


// Sub-component for Detailed View
const DistrictDetails = ({ district }: { district: string }) => {
  const { data: households, isLoading: loadingHH } = useQuery({
    queryKey: ["details-households", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: !!district,
  });

  const { data: vcas, isLoading: loadingVCAs } = useQuery({
    queryKey: ["details-vcas", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: !!district,
  });


  if (loadingHH || loadingVCAs) {
    return <div className="p-8 text-center"><LoadingDots /></div>;
  }

  const recentHH = (households ?? []).slice(0, 5);
  const recentVCAs = (vcas ?? []).slice(0, 5);

  return (
    <div className="p-4 bg-slate-50 border-t border-b border-border space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <GlowCard className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Households</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">HH Code</TableHead>
                  <TableHead className="text-xs">Village</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentHH.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">No households found.</TableCell></TableRow>
                ) : (
                  recentHH.map((h: any) => (
                    <TableRow key={h.id || h.household_id}>
                      <TableCell className="text-xs font-medium">{h.household_code || h.household_id || "N/A"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.village || h.community || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </GlowCard>

        <GlowCard className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent VCAs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">HH Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVCAs.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">No VCAs found.</TableCell></TableRow>
                ) : (
                  recentVCAs.map((v: any) => (
                    <TableRow key={v.id || v.individual_id}>
                      <TableCell className="text-xs font-medium">
                        {[v.given_name, v.firstname, v.family_name, v.lastname].filter(Boolean).join(" ") || "Unknown"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.household_code || v.household_id || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </GlowCard>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => window.location.href = `/households?district=${encodeURIComponent(district)}`}>
          View All Records for {district} <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const Districts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

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

  const mothersCountQuery = useQuery({
    queryKey: ["kpi", "mothers", dashboardDistrict],
    queryFn: () => getTotalMothersCount(dashboardDistrict),
  });

  // --- District List Discovery ---
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery", dashboardDistrict],
    queryFn: () => getHouseholdsByDistrict(dashboardDistrict === "All" ? "" : dashboardDistrict),
    staleTime: 1000 * 60 * 5,
  });

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

  const targetDistricts = discoveredDistricts.length > 0
    ? discoveredDistricts
    : dashboardDistrict !== "All" ? [dashboardDistrict] : [];

  // --- District Stats Queries ---
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

  const handleExportSummary = () => { /* ... existing export logic ... */ };

  const toggleExpand = (districtName: string) => {
    setExpandedDistrict(current => current === districtName ? null : districtName);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
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
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => {
              householdsListQuery.refetch();
              districtQueries.forEach(q => q.refetch());
              /* ... refetch KPIs ... */
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
                  <TableHead className="w-[80px] hidden md:table-cell">No.</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="hidden sm:table-cell">Households</TableHead>
                  <TableHead className="hidden sm:table-cell">VCAs</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areDistrictsLoading && districtData.length === 0 ? (
                  /* ... Loading State ... */
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
                        <LoadingDots />
                        <span className="text-xs">
                          {isDiscoveryLoading ? "Discovering districts..." : "Loading district data..."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : districtData.length === 0 ? (
                  /* ... Empty State ... */
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No district data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  districtData.map((data: any, index) => (
                    <>
                      <TableRow key={data.district} className={`group ${expandedDistrict === data.district ? "bg-muted/30" : ""}`}>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className={expandedDistrict === data.district ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}
                            onClick={() => toggleExpand(data.district)}
                          >
                            {expandedDistrict === data.district ? (
                              <>Hide <ChevronUp className="ml-1 h-3 w-3" /></>
                            ) : (
                              <>View <ChevronDown className="ml-1 h-3 w-3" /></>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedDistrict === data.district && (
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableCell colSpan={5} className="p-0 border-t-0">
                            <DistrictDetails district={data.district} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
const KpiCard = ({ title, value, caption, isLoading, delay = 0 }: { title: string, value: string, caption: string, isLoading: boolean, delay?: number }) => {
  return (
    <div style={{ animationDelay: `${delay}s` }} className="h-full">
      <GlowCard className="flex flex-col justify-between py-6 px-6 h-full">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">
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


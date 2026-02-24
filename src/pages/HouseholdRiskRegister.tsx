import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Download,
  Search,
  GraduationCap,
  ChevronRight,
  Home,
  HeartPulse,
  BookOpen,
  Shield,
  Landmark,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getHouseholdsByDistrict,
  getHouseholdServicesByDistrict
} from "@/lib/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SubPopulationFilter } from "@/components/dashboard/SubPopulationFilter";
import GlowCard from "@/components/aceternity/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { format, subDays, parseISO, isAfter } from "date-fns";
import { cn, toTitleCase } from "@/lib/utils";

const RISK_TYPES = {
  health_domain: { label: "Missing Health Services", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-50", domain: "health_services", domainLabel: "Health" },
  schooled_domain: { label: "Missing Schooled Services", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", domain: "schooled_services", domainLabel: "Schooled" },
  safe_domain: { label: "Missing Safe Services", icon: Shield, color: "text-orange-600", bg: "bg-orange-50", domain: "safe_services", domainLabel: "Safe" },
  stable_domain: { label: "Missing Stable Services", icon: Landmark, color: "text-amber-600", bg: "bg-amber-50", domain: "stable_services", domainLabel: "Stable" },
  graduation_path: { label: "Graduation Ready (All 4)", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50", domain: null, domainLabel: "All" },
};

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

const filterKeyToDataKey: Record<string, string> = {
  caahh: 'child_adolescent_in_aged_headed_household',
  caichh: 'child_adolescent_in_chronically_ill_headed_household',
  caich: 'child_adolescent_in_child_headed_household',
  calwd: 'child_adolescent_living_with_disability',
  caifhh: 'child_adolescent_in_female_headed_household',
  muc: 'under_5_malnourished',
  pbfw: 'pbfw'
};

const HouseholdRiskRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (searchParams.get("type") || "health_domain") as keyof typeof RISK_TYPES;

  // Initial state logic for district security
  const initialDistrict = (user?.description === "District User" && user?.location)
    ? user.location
    : (searchParams.get("district") || "All");

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [searchQuery, setSearchQuery] = useState("");
  const [subPopulationFilters, setSubPopulationFilters] = useState<Record<string, string>>(
    Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
  );

  const handleFilterChange = (key: string, value: string) => {
    setSubPopulationFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSubPopulationFilters(
      Object.keys(subPopulationFilterLabels).reduce((acc, key) => ({ ...acc, [key]: "all" }), {})
    );
    setSearchQuery("");
  };

  // SECURITY: Enforce district lock for District Users
  useEffect(() => {
    if (user?.description === "District User" && user?.location && selectedDistrict !== user.location) {
      setSelectedDistrict(user.location);
    }
  }, [user, selectedDistrict]);

  // Discover districts
  const hhListQuery = useQuery({
    queryKey: ["hh-districts-discovery-reg"],
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

  // Data queries
  const servicesQuery = useQuery({
    queryKey: ["hh-services-risk-reg", "All"], // Fetch all for local filtering
    queryFn: () => getHouseholdServicesByDistrict(""),
    staleTime: 1000 * 60 * 10,
  });

  const isLoading = servicesQuery.isLoading || hhListQuery.isLoading;

  const isCategoryProvided = (record: any, key: string): boolean => {
    const val = record[key];
    if (val === null || val === undefined || val === "") return false;
    const sVal = String(val).toLowerCase().trim();
    return !["not applicable", "n/a", "na", "none", "no"].includes(sVal);
  };

  const filteredData = useMemo(() => {
    if (!servicesQuery.data) return [];

    const services = servicesQuery.data as any[];
    const now = new Date();
    const NINETY_DAYS_AGO = subDays(now, 90);
    const selectedVariants = selectedDistrict === "All" ? [] : (discoveredDistrictsMap.get(selectedDistrict) || [selectedDistrict]);

    // Group services by household
    const hhMap = new Map<string, any[]>();
    services.forEach(s => {
      const hhId = String(s.household_id || s.hhid || "unknown");
      const sDist = String(s.district || "");
      if (selectedDistrict !== "All" && !selectedVariants.includes(sDist)) return;

      if (!hhMap.has(hhId)) hhMap.set(hhId, []);
      hhMap.get(hhId)?.push(s);
    });

    let resultList: any[] = [];

    hhMap.forEach((hhServices, hhId) => {
      let hasHealth = false;
      let hasSchooled = false;
      let hasSafe = false;
      let hasStable = false;
      let isActive = false;

      const lastService = hhServices[0];

      hhServices.forEach(s => {
        if (isCategoryProvided(s, "health_services")) hasHealth = true;
        if (isCategoryProvided(s, "schooled_services")) hasSchooled = true;
        if (isCategoryProvided(s, "safe_services")) hasSafe = true;
        if (isCategoryProvided(s, "stable_services")) hasStable = true;

        const sDate = s.service_date ? parseISO(String(s.service_date)) : null;
        if (sDate && isAfter(sDate, NINETY_DAYS_AGO)) isActive = true;
      });

      const allFour = hasHealth && hasSchooled && hasSafe && hasStable;

      // For domain types: show households MISSING that domain (the gap / problem records)
      // For graduation_path: show households WITH all 4 domains (ready to graduate)
      let include = false;
      if (type === "health_domain" && !hasHealth) include = true;
      else if (type === "schooled_domain" && !hasSchooled) include = true;
      else if (type === "safe_domain" && !hasSafe) include = true;
      else if (type === "stable_domain" && !hasStable) include = true;
      else if (type === "graduation_path" && allFour) include = true;

      if (include) {
        resultList.push({
          household_id: hhId,
          district: lastService.district || "Unknown",
          last_service_date: lastService.service_date || "N/A",
          domain_count: [hasHealth, hasSchooled, hasSafe, hasStable].filter(Boolean).length,
          has_health: hasHealth,
          has_schooled: hasSchooled,
          has_safe: hasSafe,
          has_stable: hasStable,
          is_active: isActive,
        });
      }
    });

    // Sub-population Filters
    const households = (hhListQuery.data ?? []) as any[];
    const hhDataMap = new Map();
    households.forEach(h => {
      hhDataMap.set(String(h.household_id || h.hhid || h.id).trim(), h);
    });

    resultList = resultList.filter((item: any) => {
      const hhData = hhDataMap.get(String(item.household_id).trim());
      return Object.entries(subPopulationFilters).every(([key, value]) => {
        if (value === "all") return true;
        if (!hhData) return false;

        let dataKey = key;
        if (key in filterKeyToDataKey) {
          dataKey = filterKeyToDataKey[key];
        }

        const recordValue = hhData[dataKey];
        return value === "yes"
          ? recordValue === "1" || recordValue === "true" || recordValue === 1 || recordValue === true
          : recordValue === "0" || recordValue === "false" || recordValue === 0 || recordValue === false;
      });
    });

    // Apply search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return resultList.filter(item =>
        item.household_id.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q)
      );
    }

    return resultList;
  }, [type, servicesQuery.data, searchQuery, subPopulationFilters, hhListQuery.data]);

  const handleExport = () => {
    if (!filteredData.length) return;

    const headers = ["Household ID", "District", "Last Service Date", "Domains Covered", "Health", "Schooled", "Safe", "Stable", "Active (90d)"];
    const rows = filteredData.map(item => [
      item.household_id,
      item.district,
      item.last_service_date,
      `${item.domain_count}/4`,
      item.has_health ? "Yes" : "No",
      item.has_schooled ? "Yes" : "No",
      item.has_safe ? "Yes" : "No",
      item.has_stable ? "Yes" : "No",
      item.is_active ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `household_domain_gap_${type}_${selectedDistrict}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const RiskIcon = RISK_TYPES[type].icon;

  return (
    <DashboardLayout subtitle="Household Stability Registry">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/household-services")}
              className="rounded-full h-10 w-10 border-slate-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <RiskIcon className={cn("h-6 w-6", RISK_TYPES[type].color)} />
                {RISK_TYPES[type].label}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {filteredData.length} households · {selectedDistrict === "All" ? "Nationwide" : selectedDistrict}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={type}
              onValueChange={(val) => {
                setSearchParams({ type: val, district: selectedDistrict });
              }}
            >
              <SelectTrigger className="w-[220px] h-10 font-bold border-slate-200">
                <SelectValue placeholder="Metric Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RISK_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDistrict}
              onValueChange={(val) => {
                setSelectedDistrict(val);
                setSearchParams({ type, district: val });
              }}
              disabled={user?.description === "District User"}
            >
              <SelectTrigger className="w-[180px] h-10 font-bold border-slate-200">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4"
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Metric Context Alert */}
        {type !== "graduation_path" && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <HeartPulse className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-xs font-black uppercase tracking-wider">Gap Analysis Mode</AlertTitle>
            <AlertDescription className="text-sm font-medium opacity-90">
              The dashboard shows overall coverage, but this register lists households specifically <strong>MISSING</strong> {RISK_TYPES[type].domainLabel} services so you can prioritize them.
            </AlertDescription>
          </Alert>
        )}

        {/* Sub-population Filters */}
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-100 shadow-sm">
          <SubPopulationFilter
            filters={subPopulationFilters}
            labels={subPopulationFilterLabels}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by Household ID or District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 border-slate-200 bg-white"
          />
        </div>

        {/* Main Table Content */}
        <GlowCard className="border-slate-200 overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-8">
                <TableSkeleton columns={6} rows={10} />
              </div>
            ) : filteredData.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">Household ID</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">District</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">Last Service</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">Domain Count</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">Status Tags</TableHead>
                    <TableHead className="text-[11px] font-black uppercase text-slate-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 100).map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-900 text-xs">
                        {item.household_id}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">
                        <Badge variant="outline" className="bg-slate-50 text-[10px] font-bold">{item.district}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500">
                        {item.last_service_date}
                      </TableCell>
                      <TableCell className="text-xs font-black text-slate-900">
                        {item.domain_count} / 4
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.has_health && <Badge className="bg-rose-100 text-rose-700 border-0 text-[9px] font-black uppercase">Health</Badge>}
                          {item.has_schooled && <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[9px] font-black uppercase">Schooled</Badge>}
                          {item.has_safe && <Badge className="bg-orange-100 text-orange-700 border-0 text-[9px] font-black uppercase">Safe</Badge>}
                          {item.has_stable && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] font-black uppercase">Stable</Badge>}
                          {item.domain_count === 4 && <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] font-black uppercase">Grad-Ready</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary font-bold text-xs"
                          onClick={() => navigate(`/profile/household-details?id=${item.household_id}`)}
                        >
                          View Profile
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Home className="h-10 w-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No records found</h3>
                <p className="text-slate-400 max-w-xs mt-1">Adjust your filters to see households in different stability phases.</p>
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </DashboardLayout>
  );
};

export default HouseholdRiskRegister;

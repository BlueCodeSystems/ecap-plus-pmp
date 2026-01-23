import { useState, useMemo } from "react";
import { Search, AlertCircle, FileText } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageIntro from "@/components/dashboard/PageIntro";
import GlowCard from "@/components/aceternity/GlowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useQuery } from "@tanstack/react-query";
import { getCaregiverServicesByDistrict, getHouseholdsByDistrict } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const HouseholdServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Discover districts
  const householdsListQuery = useQuery({
    queryKey: ["districts-discovery"],
    queryFn: () => getHouseholdsByDistrict(""),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const districts = useMemo(() => {
    if (!householdsListQuery.data) return [];
    const dists = new Set<string>();
    householdsListQuery.data.forEach((h: any) => {
      if (h.district) dists.add(h.district);
    });
    return Array.from(dists).sort();
  }, [householdsListQuery.data]);

  const servicesQuery = useQuery({
    queryKey: ["caregiver-services", "all-districts", selectedDistrict],
    queryFn: async () => {
      // Reverting to original district-based fetch if provided, or nationwide
      return getCaregiverServicesByDistrict(selectedDistrict === "All" ? "" : selectedDistrict);
    },
    retry: false,
  });

  const allServices = servicesQuery.data ?? [];

  const filteredServices = useMemo(() => {
    return allServices.filter((service: any) => {
      const hhId = String(service.household_id || service.householdId || "").toLowerCase();
      const serviceName = String(service.service || service.service_name || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return hhId.includes(query) || serviceName.includes(query);
    });
  }, [allServices, searchQuery]);

  const pickValue = (record: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      const value = record[key];
      if (value !== null && value !== undefined && value !== "") return String(value);
    }
    return "N/A";
  };

  return (
    <DashboardLayout subtitle="Nationwide Caregiver Oversight">
      <PageIntro
        eyebrow="Household Services"
        title="Nationwide Caregiver Oversight"
        description="Monitor household assessments, ART-linkage, and follow-up activities across the entire DQA platform."
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium px-3 py-1">
              {servicesQuery.isLoading ? (
                <span className="flex items-center gap-1">
                  Loading <LoadingDots className="h-1 w-1" />
                </span>
              ) : (
                `${filteredServices.length} Records`
              )}
            </Badge>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <GlowCard className="overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Caregiver Service History</h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search HH ID or Service..."
                className="pl-9 bg-white border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 w-[80px] hidden sm:table-cell">HH ID</TableHead>
                <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">District</TableHead>
                <TableHead className="font-semibold text-slate-700">Service</TableHead>
                <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Date</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right w-[80px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-slate-50/50" />
                  </TableRow>
                ))
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <FileText className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-medium">No services found in {selectedDistrict === "All" ? "All Districts" : selectedDistrict}.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service: any, index: number) => (
                  <TableRow key={`${index}-${service.id}`}>
                    <TableCell
                      className="font-medium text-primary cursor-pointer hover:underline align-top hidden sm:table-cell"
                      onClick={() => {
                        const id = pickValue(service, ["household_id", "householdId", "hh_id"]);
                        navigate(`/profile/household-profile/${encodeURIComponent(String(id))}`);
                      }}
                    >
                      <span className="text-xs">{pickValue(service, ["household_id", "householdId", "hh_id"])}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell align-top text-xs">{service.district || "N/A"}</TableCell>
                    <TableCell className="align-top px-2 sm:px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 sm:hidden">
                          <span
                            className="text-[9px] font-mono bg-slate-100 text-primary px-1 rounded cursor-pointer"
                            onClick={() => {
                              const id = pickValue(service, ["household_id", "householdId", "hh_id"]);
                              navigate(`/profile/household-profile/${encodeURIComponent(String(id))}`);
                            }}
                          >
                            {pickValue(service, ["household_id", "householdId", "hh_id"])}
                          </span>
                        </div>
                        <span className="text-sm font-medium leading-tight">
                          {pickValue(service, ["service", "service_name", "form_name"])}
                        </span>
                        <span className="text-[10px] text-slate-500 sm:hidden">
                          {service.district || "N/A"}
                        </span>
                        <span className="text-[10px] text-slate-400 md:hidden mt-1">
                          {pickValue(service, ["service_date", "visit_date", "date"])}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-top text-xs">
                      {pickValue(service, ["service_date", "visit_date", "date"])}
                    </TableCell>
                    <TableCell className="text-right align-top px-2 sm:px-4">
                      <Badge variant="outline" className="text-[9px] h-4.5 px-1 font-normal border-slate-200 bg-slate-50 text-slate-600">
                        {pickValue(service, ["status", "state", "outcome"])}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </GlowCard>
    </DashboardLayout>
  );
};

export default HouseholdServices;

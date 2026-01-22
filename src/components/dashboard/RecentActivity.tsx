import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getChildrenByDistrict,
  getHouseholdsByDistrict,
  getCaregiverServicesByDistrict,
  getVcaServicesByDistrict
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  name: string;
  action: string;
  date: Date;
  details: string;
}

const RecentActivity = () => {
  const { user } = useAuth();
  const district = user?.location ?? "";

  const { data: households, isLoading: loadingHouseholds } = useQuery({
    queryKey: ["recent-households-data", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: !!district,
  });

  const { data: vcas, isLoading: loadingVcas } = useQuery({
    queryKey: ["recent-vcas-data", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: !!district,
  });

  const { data: hhServices, isLoading: loadingHhServices } = useQuery({
    queryKey: ["recent-hh-services", district],
    queryFn: () => getCaregiverServicesByDistrict(district),
    enabled: !!district,
  });

  const { data: vcaServices, isLoading: loadingVcaServices } = useQuery({
    queryKey: ["recent-vca-services", district],
    queryFn: () => getVcaServicesByDistrict(district),
    enabled: !!district,
  });

  const parseDate = (item: any) => {
    const dateStr =
      item.service_date ||
      item.visit_date ||
      item.last_service_date ||
      item.date_registered ||
      item.registration_date ||
      item.date ||
      item.created_at ||
      item.date_created ||
      item.last_activity_date;

    if (!dateStr) return new Date(); // Fallback to current time instead of Epoch 0
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const activities: Activity[] = [
    ...(households ?? []).map((h: any) => ({
      id: String(h.household_id || h.id || `hh-${Math.random()}`),
      type: "Household",
      name: `HH ${h.household_code || h.household_id || "Unknown"}`,
      action: "New Registration",
      date: parseDate(h) || new Date(0),
      details: String(h.caregiver_name || h.village || "New household"),
    })),
    ...(vcas ?? []).map((v: any) => ({
      id: String(v.individual_id || v.id || `vca-${Math.random()}`),
      type: "VCA",
      name: `${v.given_name || v.firstname || ""} ${v.family_name || v.lastname || "Child"}`,
      action: "VCA Registration",
      date: parseDate(v) || new Date(0),
      details: `HH ${v.household_code || "Unknown"}`,
    })),
    ...(hhServices ?? []).map((s: any) => ({
      id: String(s.id || `hhs-${Math.random()}`),
      type: "Service",
      name: `HH ${s.household_id || "Unknown"}`,
      action: String(s.service || s.form_name || "Household Service"),
      date: parseDate(s) || new Date(0),
      details: String(s.status || "Completed"),
    })),
    ...(vcaServices ?? []).map((s: any) => ({
      id: String(s.id || `vcas-${Math.random()}`),
      type: "Service",
      name: `VCA ${s.vca_id || "Unknown"}`,
      action: String(s.service || s.form_name || s.service_name || "VCA Service"),
      date: parseDate(s) || new Date(0),
      details: String(s.status || "Completed"),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15);

  const formatActivityTime = (date: Date) => {
    if (date.getTime() === 0) return "Unknown time";
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const isLoading = loadingHouseholds || loadingVcas || loadingHhServices || loadingVcaServices;

  return (
    <GlowCard>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest registrations and assessments in {district || "your district"}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[320px] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading real-time activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
            No activity records found for this district.
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-4">
              {activities.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex items-start gap-4 text-sm animate-in fade-in duration-500">
                  <Avatar className="h-8 w-8 mt-1 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`} />
                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <div className="font-semibold text-foreground leading-tight">
                      {item.name}
                    </div>
                    <div className="text-slate-600 text-[13px]">
                      <span className="font-medium text-primary">{item.action}</span>
                      {item.details && <span className="text-muted-foreground"> • {item.details}</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      {formatActivityTime(item.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </GlowCard>
  );
};

export default RecentActivity;

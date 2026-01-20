import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getChildrenByDistrict, getHouseholdsByDistrict } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const RecentActivity = () => {
  const { user } = useAuth();
  const district = user?.location ?? "";

  const { data: households, isLoading: loadingHouseholds } = useQuery({
    queryKey: ["recent-households", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: !!district,
  });

  const { data: vcas, isLoading: loadingVcas } = useQuery({
    queryKey: ["recent-vcas", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: !!district,
  });

  const activities = [
    ...(households ?? []).map((h) => ({
      id: h.household_id || h.id || Math.random().toString(),
      type: "Household",
      name: `Household ${h.household_code ?? "Unknown"}`,
      action: "New Registration",
      time: "Just now", // In a real app, parse created_at
      details: `${h.village ?? "Unknown Village"}`,
    })),
    ...(vcas ?? []).map((v) => ({
      id: v.individual_id || v.id || Math.random().toString(),
      type: "VCA",
      name: `${v.given_name ?? ""} ${v.family_name ?? "Child"}`,
      action: "Assessment Completed",
      time: "Recently",
      details: `Household ${v.household_code ?? ""}`,
    })),
  ]
    .slice(0, 10); // Take first 10 for now as we don't have real dates to sort by

  const isLoading = loadingHouseholds || loadingVcas;

  return (
    <GlowCard>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest registrations and assessments in {district || "your district"}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[240px] items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
            No recent activity found.
          </div>
        ) : (
          <ScrollArea className="h-[240px] pr-4">
            <div className="space-y-4">
              {activities.map((item, i) => (
                <div key={i} className="flex items-start gap-4 text-sm">
                  <Avatar className="h-8 w-8 mt-1 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`} />
                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <div className="font-semibold text-foreground">
                      {item.name}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">{item.action}</span> - {item.details}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
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

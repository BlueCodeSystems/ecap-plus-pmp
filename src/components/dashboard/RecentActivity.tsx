import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";

const RecentActivity = () => {
  return (
    <GlowCard>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest DQA assessments and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          No recent activity available yet.
        </div>
      </CardContent>
    </GlowCard>
  );
};

export default RecentActivity;

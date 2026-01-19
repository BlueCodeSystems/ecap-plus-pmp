import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import { Progress } from "@/components/ui/progress";

const ProvincialBreakdown = () => {
  return (
    <GlowCard>
      <CardHeader>
        <CardTitle>Provincial Breakdown</CardTitle>
        <CardDescription>Data quality scores by province</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          No provincial data available yet.
        </div>
      </CardContent>
    </GlowCard>
  );
};

export default ProvincialBreakdown;

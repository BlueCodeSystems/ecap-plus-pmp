import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProvinceData {
  name: string;
  score: number;
  assessments: number;
}

const provinces: ProvinceData[] = [
  { name: "Lusaka", score: 92, assessments: 245 },
  { name: "Copperbelt", score: 88, assessments: 198 },
  { name: "Southern", score: 85, assessments: 167 },
  { name: "Central", score: 82, assessments: 145 },
  { name: "Eastern", score: 79, assessments: 132 },
  { name: "Northern", score: 76, assessments: 121 },
  { name: "Luapula", score: 74, assessments: 98 },
  { name: "North-Western", score: 71, assessments: 87 },
];

const getScoreColor = (score: number) => {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 75) return "bg-amber-500";
  return "bg-destructive";
};

const ProvincialBreakdown = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provincial Breakdown</CardTitle>
        <CardDescription>Data quality scores by province</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {provinces.map((province) => (
          <div key={province.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{province.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">
                  {province.assessments} assessments
                </span>
                <span className={`font-semibold ${
                  province.score >= 85 
                    ? "text-emerald-500" 
                    : province.score >= 75 
                    ? "text-amber-500" 
                    : "text-destructive"
                }`}>
                  {province.score}%
                </span>
              </div>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all ${getScoreColor(province.score)}`}
                style={{ width: `${province.score}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProvincialBreakdown;

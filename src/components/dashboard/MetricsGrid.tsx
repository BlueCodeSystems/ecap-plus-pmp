import { 
  TrendingUp, 
  TrendingDown, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
}

const MetricCard = ({ title, value, subtitle, icon, trend, variant = "default" }: MetricCardProps) => {
  const variantStyles = {
    default: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-destructive",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={variantStyles[variant]}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend.isPositive ? "text-emerald-500" : "text-destructive"
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsGrid = () => {
  const metrics = [
    {
      title: "Total Assessments",
      value: "1,284",
      subtitle: "This quarter",
      icon: <FileCheck className="h-5 w-5" />,
      trend: { value: 12.5, isPositive: true },
      variant: "default" as const,
    },
    {
      title: "Data Quality Score",
      value: "87.3%",
      subtitle: "Average across all provinces",
      icon: <CheckCircle2 className="h-5 w-5" />,
      trend: { value: 4.2, isPositive: true },
      variant: "success" as const,
    },
    {
      title: "Issues Found",
      value: "156",
      subtitle: "Requires attention",
      icon: <AlertTriangle className="h-5 w-5" />,
      trend: { value: 8.1, isPositive: false },
      variant: "warning" as const,
    },
    {
      title: "Pending Reviews",
      value: "43",
      subtitle: "Awaiting validation",
      icon: <Clock className="h-5 w-5" />,
      variant: "default" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default MetricsGrid;

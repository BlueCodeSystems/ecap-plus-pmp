import {
  FileCheck,
  Home,
  Users,
  Briefcase,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  getTotalHouseholdsCount,
  getTotalVcasCount,
  getTotalMothersCount,
  getCaseworkerCountByDistrict,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  isLoading,
}: MetricCardProps & { isLoading?: boolean }) => {
  const variantStyles = {
    default: "text-primary",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-destructive",
  };

  return (
    <GlowCard>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={variantStyles[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {isLoading ? <LoadingDots className="text-slate-600" /> : value}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs ${trend.isPositive ? "text-emerald-500" : "text-destructive"
                }`}
            >
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
    </GlowCard>
  );
};

const MetricsGrid = () => {
  const { user } = useAuth();
  const district = user?.location ?? "";

  const totalVcasQuery = useQuery({
    queryKey: ["metrics", "total-vcas", district],
    queryFn: () => getTotalVcasCount(district),
    enabled: !!district,
  });

  const totalHouseholdsQuery = useQuery({
    queryKey: ["metrics", "total-households", district],
    queryFn: () => getTotalHouseholdsCount(district),
    enabled: !!district,
  });

  const totalMothersQuery = useQuery({
    queryKey: ["metrics", "total-mothers", district],
    queryFn: () => getTotalMothersCount(district),
    enabled: !!district,
  });

  const caseworkersQuery = useQuery({
    queryKey: ["metrics", "caseworkers", district],
    queryFn: () => getCaseworkerCountByDistrict(district),
    enabled: !!district,
  });

  const formatCount = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    return new Intl.NumberFormat("en-GB").format(value);
  };

  const getListCount = (data: any[] | undefined) => {
    if (!data) return "N/A";
    return Array.isArray(data) ? formatCount(data.length) : "0";
  }

  const summaryMetrics = [
    {
      title: "Total VCAs",
      value: formatCount(totalVcasQuery.data),
      subtitle: "All registered children",
      icon: <FileCheck className="h-5 w-5" />,
      variant: "default" as const,
      isLoading: totalVcasQuery.isLoading,
    },
    {
      title: "Total Households",
      value: formatCount(totalHouseholdsQuery.data),
      subtitle: "Households tracked",
      icon: <Home className="h-5 w-5" />,
      variant: "success" as const,
      isLoading: totalHouseholdsQuery.isLoading,
    },
    {
      title: "Index Mothers",
      value: formatCount(totalMothersQuery.data),
      subtitle: "Registered mothers",
      icon: <Users className="h-5 w-5" />,
      variant: "warning" as const,
      isLoading: totalMothersQuery.isLoading,
    },
    {
      title: "Caseworkers",
      value: formatCount(caseworkersQuery.data),
      subtitle: "All districts district",
      icon: <Briefcase className="h-5 w-5" />,
      variant: "default" as const,
      isLoading: caseworkersQuery.isLoading,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;

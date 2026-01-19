import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  Home,
  Users,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import {
  DEFAULT_DISTRICT,
  getCaseworkerCountByDistrict,
  getTotalHouseholdsCount,
  getTotalMothersCount,
  getTotalVcasCount,
} from "@/lib/api";

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
  const userLocation = user?.location;

  console.log("MetricsGrid: user data:", user);
  console.log("MetricsGrid: user keys:", user ? Object.keys(user) : "no user");
  console.log("MetricsGrid: userLocation:", userLocation);

  const totalVcasQuery = useQuery({
    queryKey: ["metrics", "total-vcas", userLocation],
    queryFn: () => getTotalVcasCount(userLocation),
  });

  console.log("MetricsGrid: totalVcasQuery state:", {
    data: totalVcasQuery.data,
    isLoading: totalVcasQuery.isLoading,
    error: totalVcasQuery.error,
  });

  const totalHouseholdsQuery = useQuery({
    queryKey: ["metrics", "total-households", userLocation],
    queryFn: () => getTotalHouseholdsCount(userLocation),
  });

  const totalMothersQuery = useQuery({
    queryKey: ["metrics", "total-mothers"],
    queryFn: getTotalMothersCount,
  });

  const caseworkerQuery = useQuery({
    queryKey: ["metrics", "caseworkers", DEFAULT_DISTRICT ?? "all"],
    queryFn: () =>
      DEFAULT_DISTRICT ? getCaseworkerCountByDistrict(DEFAULT_DISTRICT) : Promise.resolve(null),
  });

  const formatCount = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return new Intl.NumberFormat("en-GB").format(value);
  };

  const districtLabel = DEFAULT_DISTRICT ?? "All districts";

  const metrics = [
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
      value: formatCount(caseworkerQuery.data),
      subtitle: `${districtLabel} district`,
      icon: <User className="h-5 w-5" />,
      variant: "default" as const,
      isLoading: caseworkerQuery.isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
};

export default MetricsGrid;

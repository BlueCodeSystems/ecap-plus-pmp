import {
  TrendingUp,
  TrendingDown,
  FileCheck,
  Home,
  Archive,
  BookOpen,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlowCard from "@/components/aceternity/GlowCard";
import LoadingDots from "@/components/aceternity/LoadingDots";
import {
  getTotalHouseholdsCount,
  getTotalVcasCount,
  getHouseholdsByDistrict,
  getChildrenByDistrict,
  getHouseholdArchivedRegister,
  getChildrenArchivedRegister,
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

  // Register Queries (fetching lists to get lengths)
  const householdRegisterQuery = useQuery({
    queryKey: ["metrics", "household-register", district],
    queryFn: () => getHouseholdsByDistrict(district),
    enabled: !!district,
  });

  const vcaRegisterQuery = useQuery({
    queryKey: ["metrics", "vca-register", district],
    queryFn: () => getChildrenByDistrict(district),
    enabled: !!district,
  });

  const householdArchivedQuery = useQuery({
    queryKey: ["metrics", "household-archived", district],
    queryFn: () => getHouseholdArchivedRegister(district),
    enabled: !!district,
  });

  const vcaArchivedQuery = useQuery({
    queryKey: ["metrics", "vca-archived", district],
    queryFn: () => getChildrenArchivedRegister(district),
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
  ];

  const registerMetrics = [
    {
      title: "Household Register",
      value: getListCount(householdRegisterQuery.data),
      subtitle: "Active Households",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "default" as const,
      isLoading: householdRegisterQuery.isLoading,
    },
    {
      title: "VCA Register",
      value: getListCount(vcaRegisterQuery.data),
      subtitle: "Active VCAs",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "default" as const,
      isLoading: vcaRegisterQuery.isLoading,
    },
    {
      title: "Household Archived Register",
      value: getListCount(householdArchivedQuery.data),
      subtitle: "Archived Households",
      icon: <Archive className="h-5 w-5" />,
      variant: "warning" as const,
      isLoading: householdArchivedQuery.isLoading,
    },
    {
      title: "VCA Archived Register",
      value: getListCount(vcaArchivedQuery.data), // Assuming backend returns list
      subtitle: "Archived VCAs",
      icon: <Archive className="h-5 w-5" />,
      variant: "warning" as const,
      isLoading: vcaArchivedQuery.isLoading,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {registerMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default MetricsGrid;

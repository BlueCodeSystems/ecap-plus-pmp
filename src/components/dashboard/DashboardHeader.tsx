import { Bell, Search, User, Sun, Moon, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { useQuery } from "@tanstack/react-query";
import {
  getCaregiverServicesByDistrict
} from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";

type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
};

const DashboardHeader = ({
  subtitle = "Data Quality & Program Operations",
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const district = user?.location ?? "";

  // Real Notifications Logic (similar to RecentActivity)
  // Directus Notifications
  const { data: directusNotifications } = useQuery({
    queryKey: ["directus-notifications"],
    queryFn: async () => {
      const { getNotifications } = await import("@/lib/directus");
      return getNotifications();
    },
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  const notifications = (directusNotifications ?? []).map((n: any) => ({
    id: n.id,
    title: n.subject,
    description: n.message, // Use message directly
    date: new Date(n.timestamp),
    icon: <Bell className="h-4 w-4 text-primary" />, // Default icon
  }));

  const unreadCount = notifications.length;

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex-1 flex items-center justify-between">
      <div className="hidden sm:flex flex-col">
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-1 items-center gap-3 md:pl-6">
        {/* Global Search Component */}
        <div className="flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:ml-0 sm:w-auto md:ml-auto">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Bell className="h-5 w-5 text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="p-4 border-b">
                <h3 className="font-bold text-sm">System Notifications</h3>
                <p className="text-[11px] text-muted-foreground">Real-time alerts for {district || "your area"}</p>
              </div>
              <ScrollArea className="h-72">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-3">
                      <div className="mt-0.5">{n.icon}</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{n.description}</p>
                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-medium">
                          {formatDistanceToNow(n.date, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
              <div className="p-2 border-t text-center">
                <Button
                  variant="ghost"
                  className="w-full text-[10px] h-8 font-bold uppercase tracking-widest text-primary"
                  onClick={() => {
                    const element = document.getElementById("recent-activity-section");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth" });
                    } else {
                      navigate("/dashboard#recent-activity-section");
                    }
                  }}
                >
                  View All Activity
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

import { Bell, Search, User, Sun, Moon, Clock, CheckCircle2, X, DatabaseZap, CircleHelp, Calendar, LogOut, Sparkles } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFileUrl } from "@/lib/directus";
import {
  getCaregiverServicesByDistrict
} from "@/lib/api";
import { markNotificationRead, clearAllNotifications } from "@/lib/directus";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingDots from "@/components/aceternity/LoadingDots";
import { useRef, useEffect, useState, useMemo } from "react";

// Simple notification sound (Beep)
const BEEP_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder beep

type DashboardHeaderProps = {
  title?: string;
  subtitle?: string;
};

const DashboardHeader = ({
  subtitle = "Data quality & program operations",
}: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const district = user?.location ?? "";

  const { data: directusNotifications } = useQuery({
    queryKey: ["directus-notifications", user?.id],
    queryFn: async () => {
      const { getNotifications } = await import("@/lib/directus");
      return getNotifications(user?.id); // Pass user.id for security
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30 seconds for performance & responsiveness
    enabled: !!user?.id,
  });

  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notifications = useMemo(() => {
    return (directusNotifications ?? [])
      .filter((n: any) => n.recipient === user?.id) // Extra safety check for confidentiality
      .map((n: any) => {
        const isExtract = n.collection === "weekly_extracts";
        return {
          id: n.id,
          title: n.subject,
          description: n.message,
          date: new Date(n.timestamp),
          icon: isExtract
            ? <DatabaseZap className="h-4 w-4 text-emerald-600" />
            : <Bell className="h-4 w-4 text-primary" />,
          link: isExtract
            ? "/weekly-extracts"
            : n.collection?.startsWith("support") && n.sender
              ? `/support?userId=${n.sender}`
              : undefined,
        };
      });
  }, [directusNotifications, user?.id]);

  const unreadCount = notifications.length;

  // Sound Logic
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
      }
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ["directus-notifications"] });
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await clearAllNotifications(user.id);
      queryClient.invalidateQueries({ queryKey: ["directus-notifications"] });
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

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
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-1 items-center gap-3 md:pl-6">
        {/* Global Search Component */}
        <div className="flex-1 max-w-xl">
          <GlobalSearch />
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:ml-0 sm:w-auto md:ml-auto">
          {/* Help & Support */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex relative transition-transform duration-300 hover:-translate-y-0.5 text-slate-500 hover:text-primary hover:bg-transparent"
            onClick={() => navigate("/support")}
            title="Support center"
          >
            <CircleHelp className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex relative transition-transform duration-300 hover:-translate-y-0.5 text-slate-500 hover:text-primary hover:bg-transparent"
            onClick={() => navigate("/calendar")}
            title="Event calendar"
          >
            <Calendar className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50/60"
              >
                <Bell className="h-5 w-5 text-slate-500" />
                {unreadCount > 0 && (
                  <>
                    <span aria-hidden className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-400 animate-ping opacity-50" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-1 text-[10px] font-bold text-white shadow-sm shadow-emerald-700/30 ring-2 ring-white">
                      {unreadCount}
                    </span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="relative w-80 p-0 rounded-2xl border border-emerald-100/60 bg-white/90 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(15,118,110,0.4)] overflow-hidden"
            >
              {/* Aurora background */}
              <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.10),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(14,165,233,0.08),transparent_50%)]" />
              </div>

              <div className="px-4 py-3 border-b border-emerald-100/40 bg-gradient-to-r from-emerald-50/40 via-teal-50/20 to-transparent flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 ring-1 ring-white/60 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-700">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Tasks and alerts for {district || "your area"}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition-colors px-2 py-1 rounded-md hover:bg-emerald-50/70"
                    onClick={handleClearAll}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ScrollArea className="h-72">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <Bell className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">All caught up</p>
                    <p className="text-[11px] text-slate-500">No recent notifications.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="px-4 py-3 border-b border-emerald-50/60 last:border-0 rounded-none cursor-pointer transition-colors focus:bg-gradient-to-r focus:from-emerald-50/40 focus:via-teal-50/20 focus:to-transparent flex gap-3 items-start"
                      onClick={() => {
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 ring-1 ring-white/60 shadow-sm">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 whitespace-normal leading-relaxed">{n.description}</p>
                        <p className="text-[10px] text-emerald-600/80 mt-1 font-semibold">
                          {formatDistanceToNow(n.date, { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        className="shrink-0 mt-0.5 h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Dismiss"
                        onClick={(e) => handleDismiss(n.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
              <div className="p-2 border-t border-emerald-100/40 bg-gradient-to-r from-emerald-50/30 via-teal-50/15 to-transparent text-center">
                <button
                  className="w-full text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 hover:text-emerald-800 py-1.5 rounded-md hover:bg-emerald-50/70 transition-colors"
                  onClick={() => {
                    navigate("/support");
                  }}
                >
                  View all activity
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-1 sm:px-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-50/60"
              >
                <div className="relative">
                  <div aria-hidden className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-emerald-400/60 via-teal-400/40 to-sky-400/40 blur-sm opacity-70" />
                  <Avatar className="relative h-8 w-8 ring-2 ring-white shadow-sm">
                    <AvatarImage src={user?.avatar ? getFileUrl(user.avatar) : undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white text-xs sm:text-sm font-extrabold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="hidden sm:block text-sm font-bold text-slate-700">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl shadow-[0_30px_80px_-30px_rgba(15,118,110,0.4)] border border-emerald-100/60 bg-white/90 backdrop-blur-xl p-1.5 overflow-hidden"
            >
              {/* Aurora background */}
              <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.10),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(14,165,233,0.08),transparent_50%)]" />
              </div>

              <DropdownMenuLabel className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div aria-hidden className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-emerald-400/60 via-teal-400/40 to-sky-400/40 blur-sm opacity-70" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 ring-2 ring-white shadow-sm overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={getFileUrl(user.avatar)}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-extrabold text-white">{initials}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">{displayName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  My account
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-emerald-100/40" />

              <DropdownMenuItem
                className="rounded-lg px-3 py-2.5 cursor-pointer transition-all focus:bg-gradient-to-r focus:from-emerald-50/80 focus:via-teal-50/40 focus:to-transparent focus:text-emerald-700 group"
                onClick={() => navigate("/profile")}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 mr-2 transition-colors group-focus:bg-emerald-100">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-700 group-focus:text-emerald-700">Profile</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-emerald-100/40" />

              <DropdownMenuItem
                className="rounded-lg px-3 py-2.5 cursor-pointer transition-all focus:bg-gradient-to-r focus:from-rose-50/80 focus:via-pink-50/40 focus:to-transparent focus:text-rose-700 group"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 ring-1 ring-rose-100 mr-2 transition-colors group-focus:bg-rose-100">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-rose-600">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </div>
  );
};

export default DashboardHeader;

import { useMemo, useEffect } from "react";
import {
  Archive,
  BarChart3,
  ClipboardList,
  DatabaseZap,
  Flag,
  Home,
  LogOut,
  MapPin,
  Users,
  UserCog,
  HeartPulse,
  CircleHelp,
  Calendar,
  Briefcase,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFileUrl } from "@/lib/directus";

const sections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Calendar", url: "/calendar", icon: Calendar },
      { title: "Districts", url: "/districts", icon: MapPin },
      { title: "Charts", url: "/charts", icon: BarChart3 },
      { title: "Caseworkers", url: "/caseworkers", icon: Briefcase },
    ],
  },
  {
    label: "Registers",
    items: [
      { title: "Households", url: "/households", icon: Home },
      { title: "VCAs", url: "/vcas", icon: Users },
      { title: "HTS Register", url: "/registers/hts", icon: Users },
      { title: "PMTCT", url: "/registers/pmtct", icon: HeartPulse },
    ],
  },
  {
    label: "Archived",
    items: [
      { title: "Households", url: "/households/archived", icon: Archive },
      { title: "VCAs", url: "/vcas/archived", icon: Archive },
    ],
  },
  {
    label: "Services",
    items: [
      { title: "Household Services", url: "/household-services", icon: Home },
      { title: "VCA Services", url: "/vca-services", icon: ClipboardList },
      { title: "Caregiver Services", url: "/caregiver-services", icon: HeartPulse },

      { title: "Flags", url: "/flags", icon: Flag },
    ],
  },
  {
    label: "Data pipeline",
    items: [
      { title: "Weekly Extracts", url: "/weekly-extracts", icon: DatabaseZap },
    ],
  },
  {
    label: "Admin",
    items: [
      { title: "Users", url: "/users", icon: UserCog },
    ],
  },
  {
    label: "Help & support",
    items: [
      { title: "Support Center", url: "/support", icon: CircleHelp },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const currentPath = location.pathname;

  const filteredSections = useMemo(() => {
    if (!user) return [];

    const roleName = (typeof user.role === "string" ? user.role : user.role?.name || "").toLowerCase();
    const isAdmin = roleName === "administrator";
    const isSupport = user.description === "Support User" || roleName.includes("support");
    const isDistrictUser = user.description === "District User";
    const isProvincialUser = user.description === "Provincial User";

    return sections.map(section => {
      const filteredItems = section.items.filter(item => {
        // Caseworkers: Restricted for District Users
        if (item.url === "/caseworkers" && isDistrictUser) return false;

        // Districts page: Restricted for District Users (per security intent)
        if (item.url === "/districts" && isDistrictUser) return false;

        // Admin: Only for Admins and Support
        if (section.label === "Admin" && !isAdmin && !isSupport) return false;

        // Data Pipeline: Only for Admins and Support
        if (section.label === "Data Pipeline" && !isAdmin && !isSupport) return false;

        return true;
      });

      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  }, [user]);

  const isActive = (path: string) => currentPath === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" style={{ backgroundColor: 'var(--sidebar-background)' } as any}>
      {/* Logo */}
      <SidebarHeader className="px-5 py-5">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            {collapsed ? "E+" : "ECAP+ PMP"}
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3">
        {filteredSections.map((section) => (
          <SidebarGroup key={section.label} className="pb-2 pt-3">
            <SidebarGroupLabel className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground/70">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-[7px] text-xs font-semibold transition-colors duration-150",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                          )}
                          activeClassName=""
                        >
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              active ? "text-primary" : "text-slate-400"
                            )}
                            strokeWidth={active ? 2.2 : 1.8}
                          />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-100 px-4 py-3">
        {user && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 mb-1 cursor-pointer hover:bg-slate-50 -mx-1 px-2 transition-colors",
              collapsed && "justify-center mx-0 px-0"
            )}
            onClick={() => navigate("/profile")}
          >
            <Avatar className="h-8 w-8 shrink-0 rounded-full">
              <AvatarImage src={user.avatar ? getFileUrl(user.avatar) : undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase rounded-full">
                {user.first_name?.[0] ?? user.email[0]}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user.email}
                </span>
                <span className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                  {typeof user.role === "string" ? user.role : user.role?.name ?? "User"}
                </span>
              </div>
            )}
          </div>
        )}
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 -mx-1",
            collapsed && "justify-center mx-0 px-0"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

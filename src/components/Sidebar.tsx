"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, Calendar, Clock, Settings,
  ChevronRight, Zap, LogOut, Megaphone, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmsUser } from "./providers/EmsProvider";
import { hasPermission, UserRole } from "@/lib/permissions";
import { NotificationBell } from "@codeswayam/auth";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/users", icon: Users, label: "Users", roles: ['admin', 'ceo', 'manager'] },
      { href: "/tasks", icon: CheckSquare, label: "Tasks" },
      { href: "/meetings", icon: Calendar, label: "Meetings" },
      { href: "/calendar", icon: Calendar, label: "Calendar" },
      { href: "/teams", icon: Users, label: "Teams", roles: ['admin', 'ceo', 'manager', 'team_leader'] },
    ],
  },
  {
    label: "Activity",
    items: [
      { href: "/tracking", icon: Clock, label: "Time Tracking" },
      { href: "/attendance", icon: Users, label: "Attendance" },
      { href: "/announcements", icon: Megaphone, label: "Announcements" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useEmsUser();

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    const currentRole = (user.appRole || (user as any).role) as UserRole;
    return roles.some(role => hasPermission(currentRole, role as UserRole));
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || hasRole(item.roles))
  })).filter(group => group.items.length > 0);

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  const handleNavClick = () => {
    // Close the mobile drawer when a nav item is clicked
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Positioning & sizing
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col",
          // Desktop: always visible, sticky, not fixed
          "md:static md:z-auto md:translate-x-0 md:min-h-screen md:sticky md:top-0",
          // Mobile: slide in/out based on isOpen
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Smooth slide transition
          "transition-transform duration-300 ease-in-out",
        )}
        style={{ background: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center shadow-lg">
            <Zap size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold tracking-tight text-white">EMS System</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Employee Management</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                        active
                          ? "bg-violet-500/20 text-violet-300 shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon
                        size={18}
                        className={cn(
                          "flex-shrink-0 transition-colors",
                          active ? "text-violet-400" : "text-white/40 group-hover:text-white/70"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight size={14} className="text-violet-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10 space-y-3">
          {/* Push notification toggle */}
          <div className="px-3">
            <NotificationBell saasId="ems" className="w-full justify-center" />
          </div>
          
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 uppercase">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-white/40 truncate uppercase tracking-tight">{user?.appRole || (user as any)?.role || 'Guest'}</p>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-white transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Smile,
  BookOpen,
  BarChart3,
  Trophy,
  FileDown,
  Stethoscope,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { startSyncListener } from "../services/syncService";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "nav.dashboard" },
  { to: "/mood", icon: Smile, label: "nav.mood" },
  { to: "/journal", icon: BookOpen, label: "nav.journal" },
  { to: "/analytics", icon: BarChart3, label: "nav.analytics" },
  { to: "/achievements", icon: Trophy, label: "nav.achievements" },
  { to: "/export", icon: FileDown, label: "nav.export" },
  { to: "/therapist", icon: Stethoscope, label: "nav.therapist" },
  { to: "/recommendations", icon: Lightbulb, label: "nav.recommendations" },
  { to: "/settings", icon: Settings, label: "nav.settings" },
];

const mobileNavItems = [
  { to: "/", icon: LayoutDashboard, label: "nav.dashboard" },
  { to: "/mood", icon: Smile, label: "nav.mood" },
  { to: "/journal", icon: BookOpen, label: "nav.journal" },
  { to: "/analytics", icon: BarChart3, label: "nav.analytics" },
  { to: "/settings", icon: Settings, label: "nav.more" },
];

export default function Layout() {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    startSyncListener();
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Desktop Sidebar (lg+) ── */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-nav shadow-nav print:hidden z-40">
        <div className="flex h-18 items-center gap-2 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal text-white font-bold text-sm transition-default">
            dw
          </div>
          <span className="text-lg font-bold tracking-tight text-nav-foreground">
            dont-worry
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-default",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-default hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      {/* ── Mobile Header (<lg) ── */}
      <header className="sticky top-0 z-50 flex lg:hidden h-14 items-center justify-between border-b bg-nav px-4 print:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal text-white font-bold text-xs">
            dw
          </div>
          <span className="text-base font-bold text-nav-foreground">
            dont-worry
          </span>
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-nav-foreground/70 transition-default hover:bg-white/10 hover:text-nav-foreground md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={signOut}
            className="hidden md:flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-nav-foreground/70 transition-default hover:bg-white/10 hover:text-nav-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </header>

      {/* ── Mobile slide-down menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 border-b bg-nav shadow-nav animate-fade-in md:hidden print:hidden">
          <nav className="flex flex-col p-3 gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-default",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {t(item.label)}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition-default hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              {t("nav.logout")}
            </button>
          </nav>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64 animate-fade-in">
        <div className="mx-auto max-w-screen-xl p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav (<md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-nav shadow-nav md:hidden print:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-default",
                isActive
                  ? "text-brand-teal"
                  : "text-nav-foreground/50 hover:text-nav-foreground/80"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Smile,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { startSyncListener } from "../services/syncService";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Prehled" },
  { to: "/mood", icon: Smile, label: "Nalada" },
  { to: "/journal", icon: BookOpen, label: "Denik" },
  { to: "/analytics", icon: BarChart3, label: "Analytika" },
  { to: "/settings", icon: Settings, label: "Nastaveni" },
];

export default function Layout() {
  const { signOut } = useAuth();

  useEffect(() => {
    startSyncListener();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold tracking-tight">dont-worry</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Odhlasit se</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:flex w-56 flex-col gap-1 border-r p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

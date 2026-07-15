import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  CheckSquare, 
  LayoutDashboard, 
  Settings, 
  Trophy, 
  Tags, 
  Activity, 
  LogOut,
  Flame,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetGamificationProfile, getGetGamificationProfileQueryKey } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const { data: profile } = useGetGamificationProfile({
    query: {
      enabled: !!user?.id,
      queryKey: getGetGamificationProfileQueryKey()
    }
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/history", label: "Activity", icon: Activity },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-sidebar/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            TaskFlow
          </div>
        </div>

        <div className="px-4 pb-4">
          <Button asChild className="w-full justify-start gap-2 shadow-lg shadow-primary/20" size="lg">
            <Link href="/tasks/new">
              <Plus className="w-5 h-5" />
              New Task
            </Link>
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href) && item.href !== "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {profile && (
          <div className="px-4 py-4 mx-4 mb-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level {profile.level}</div>
              <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                <Flame className="w-3 h-3" />
                {profile.currentStreak}
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out" 
                style={{ width: `${(profile.totalXp / (profile.totalXp + profile.xpToNextLevel)) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-center font-medium text-foreground">
              {profile.levelName}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10 border border-border/50">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-foreground">{user?.firstName || "User"} {user?.lastName}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

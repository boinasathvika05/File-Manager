import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
          <CardDescription>Your personal information provided by Replit.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="w-20 h-20 border-2 border-border shadow-lg">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="text-xl font-bold text-foreground">{user?.firstName || "Unknown"} {user?.lastName}</div>
            <div className="text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full border border-border/50 inline-block">
              {user?.email || "No email provided"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5" /> Appearance</CardTitle>
          <CardDescription>Customize how TaskFlow looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "light" ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "dark" ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "system" ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="destructive" className="gap-2 px-8" onClick={() => logout()}>
          <LogOut className="w-4 h-4" />
          Sign out everywhere
        </Button>
      </div>
    </div>
  );
}

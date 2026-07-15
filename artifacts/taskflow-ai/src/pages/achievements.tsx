import { useListAchievements, useGetGamificationProfile } from "@workspace/api-client-react";
import { Trophy, Lock, Zap, Flame, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Achievements() {
  const { data: achievements, isLoading: achLoading } = useListAchievements();
  const { data: profile, isLoading: profLoading } = useGetGamificationProfile();

  if (profLoading || achLoading) {
    return <div className="p-8 max-w-6xl mx-auto flex justify-center py-32"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  const xpPercentage = profile ? (profile.totalXp / (profile.totalXp + profile.xpToNextLevel)) * 100 : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Command History</h1>
        <p className="text-muted-foreground text-lg">Every completed task builds your profile. Unlock achievements to prove your consistency.</p>
      </div>

      {profile && (
        <Card className="bg-card/80 backdrop-blur-md border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-orange-500" />
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full border-8 border-background bg-secondary flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-primary/10" />
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Level</div>
                  <div className="text-5xl font-black text-foreground">{profile.level}</div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/20 rounded-full blur-2xl z-0" />
            </div>

            <div className="flex-1 w-full text-center md:text-left space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">{profile.levelName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-medium text-muted-foreground">
                  <span className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Star className="w-4 h-4 text-yellow-500" /> {profile.totalXp} Total XP
                  </span>
                  <span className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Flame className="w-4 h-4 text-orange-500" /> {profile.currentStreak} Day Streak
                  </span>
                  <span className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <Trophy className="w-4 h-4 text-primary" /> {profile.unlockedAchievementsCount} Unlocked
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground">Progress to Level {profile.level + 1}</span>
                  <span className="text-primary">{profile.xpToNextLevel} XP needed</span>
                </div>
                <Progress value={xpPercentage} className="h-3 bg-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          Achievement Gallery
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements?.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                "h-full transition-all duration-300",
                ach.unlocked 
                  ? "bg-card/80 border-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.15)]" 
                  : "bg-background border-border/50 opacity-70 grayscale"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
                      ach.unlocked ? "bg-primary/20" : "bg-muted"
                    )}>
                      {ach.icon}
                    </div>
                    {!ach.unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    {ach.unlocked && <div className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-full">+{ach.xpReward} XP</div>}
                  </div>
                  <h4 className={cn("font-bold text-lg mb-2", ach.unlocked ? "text-foreground" : "text-muted-foreground")}>
                    {ach.name}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ach.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

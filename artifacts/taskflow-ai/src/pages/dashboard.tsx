import { 
  useGetDashboardStats, 
  useGetDashboardActivity, 
  useGetWeeklyProgress,
  useListTasks
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, Flame, Trophy, Activity, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity({ limit: 5 });
  const { data: weeklyProgress, isLoading: weeklyLoading } = useGetWeeklyProgress();
  const { data: todayTasks, isLoading: tasksLoading } = useListTasks({ filter: "today" });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const today = format(new Date(), "EEEE, MMMM do");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">{today}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
            {greeting()}, {user?.firstName || "Commander"}
          </h1>
          <p className="text-muted-foreground italic text-sm max-w-xl">
            "{stats?.motivationalQuote || "Ready to enter flow state."}"
          </p>
        </div>
        
        {stats && (
          <div className="relative z-10 flex gap-4 md:gap-6 bg-background/50 backdrop-blur rounded-xl p-4 border border-border/50">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Score</div>
              <div className="text-2xl font-bold text-primary flex items-center gap-1 justify-center">
                <Target className="w-5 h-5" />
                {stats.productivityScore}
              </div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Streak</div>
              <div className="text-2xl font-bold text-orange-500 flex items-center gap-1 justify-center">
                <Flame className="w-5 h-5" />
                {stats.currentStreak}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed Today", value: stats?.completedToday || 0, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Pending Tasks", value: stats?.pendingTasks || 0, icon: Circle, color: "text-blue-500" },
          { label: "Overdue", value: stats?.overdueTasks || 0, icon: Clock, color: "text-destructive" },
          { label: "Level", value: stats?.level || 1, icon: Trophy, color: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/80 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-background border border-border/50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{statsLoading ? "-" : stat.value}</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Today's Tasks */}
        <Card className="md:col-span-2 border-border bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Today's Focus</CardTitle>
              <CardDescription>Your priority tasks for {format(new Date(), "MMM d")}</CardDescription>
            </div>
            <Link href="/tasks" className="text-sm text-primary hover:underline font-medium">
              View All
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {tasksLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : todayTasks?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <CheckCircle2 className="w-12 h-12 mb-3 text-muted/50" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">Enjoy your flow state.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks?.slice(0, 5).map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors flex items-center gap-3 cursor-pointer group">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'completed' ? 'bg-emerald-500' :
                        task.priority === 'urgent' ? 'bg-red-500' : 
                        task.priority === 'high' ? 'bg-orange-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress & Activity */}
        <div className="space-y-8">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Weekly Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                {weeklyLoading ? (
                  <div className="w-full h-full bg-muted/20 animate-pulse rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyProgress}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => format(new Date(val), 'EEEE').substring(0, 1)}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                      />
                      <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                        {weeklyProgress?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.date === format(new Date(), 'yyyy-MM-dd') ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.3)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Action</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-lg" />)}
                </div>
              ) : activity?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {activity?.map((item, i) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <div className={`w-2 h-2 rounded-full ${item.action === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`} />
                      </div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-background/50 border border-border/50 p-3 rounded shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium capitalize text-muted-foreground">{item.action}</span>
                          <time className="text-[10px] text-muted-foreground">{format(new Date(item.timestamp), 'h:mm a')}</time>
                        </div>
                        <div className="text-sm font-medium text-foreground truncate">{item.taskTitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

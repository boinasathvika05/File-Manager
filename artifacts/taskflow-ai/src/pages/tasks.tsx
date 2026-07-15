import { useListTasks, useUpdateTask, useListCategories } from "@workspace/api-client-react";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Calendar as CalendarIcon, List as ListIcon, LayoutDashboard, Clock, AlertTriangle, Circle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tasks, isLoading } = useListTasks({
    filter: filter !== "all" ? filter : undefined,
    search: search || undefined
  });

  const updateTask = useUpdateTask();

  const toggleComplete = (taskId: number, currentStatus: string) => {
    updateTask.mutate({
      id: taskId,
      data: { status: currentStatus === "completed" ? "pending" : "completed" }
    });
  };

  const renderList = () => {
    if (isLoading) {
      return <div className="space-y-2 mt-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />)}
      </div>;
    }

    if (!tasks?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <CheckCircle2 className="w-16 h-16 mb-4 text-muted" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm">Change your filters or create a new task.</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 mt-4">
        <AnimatePresence>
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-accent/10 hover:border-border",
                task.status === 'completed' && "opacity-60"
              )}
            >
              <button 
                onClick={() => toggleComplete(task.id, task.status)}
                className="flex-shrink-0 focus:outline-none"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>

              <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-sm font-semibold truncate transition-colors",
                    task.status === 'completed' ? "line-through text-muted-foreground" : "text-foreground group-hover:text-primary"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {task.categoryName && (
                      <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: task.categoryColor || 'var(--primary)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.categoryColor || 'var(--primary)' }} />
                        {task.categoryName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "capitalize text-[10px] font-bold px-2 py-0.5",
                    task.priority === 'urgent' && "border-red-500/30 text-red-500 bg-red-500/10",
                    task.priority === 'high' && "border-orange-500/30 text-orange-500 bg-orange-500/10",
                    task.priority === 'medium' && "border-yellow-500/30 text-yellow-500 bg-yellow-500/10",
                    task.priority === 'low' && "border-blue-500/30 text-blue-500 bg-blue-500/10",
                  )}>
                    {task.priority}
                  </Badge>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderKanban = () => {
    if (isLoading) return <div className="mt-8 text-center text-muted-foreground">Loading board...</div>;
    
    const columns = [
      { id: "pending", title: "To Do" },
      { id: "in_progress", title: "In Progress" },
      { id: "completed", title: "Done" }
    ];

    return (
      <div className="flex gap-6 mt-6 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTasks = tasks?.filter(t => t.status === col.id) || [];
          return (
            <div key={col.id} className="flex-shrink-0 w-80 bg-muted/10 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">{col.title}</h3>
                <Badge variant="secondary" className="bg-background/50">{colTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {colTasks.map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <Card className="p-4 bg-card/80 backdrop-blur border border-border/50 hover:border-primary/50 transition-colors shadow-sm cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          task.priority === 'urgent' ? 'bg-red-500' : 
                          task.priority === 'high' ? 'bg-orange-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <h4 className="flex-1 px-2 text-sm font-medium leading-tight group-hover:text-primary transition-colors">{task.title}</h4>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        {task.categoryName ? (
                          <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-background border border-border/50" style={{ color: task.categoryColor || 'inherit' }}>
                            {task.categoryName}
                          </span>
                        ) : <span />}
                        {task.dueDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage, filter, and execute your tasks.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-9 bg-card/50 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button asChild className="shrink-0 gap-2 shadow-lg shadow-primary/20">
            <Link href="/tasks/new">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-2xl">
          {[
            { id: "all", label: "All Tasks" },
            { id: "today", label: "Today" },
            { id: "tomorrow", label: "Tomorrow" },
            { id: "week", label: "This Week" },
            { id: "overdue", label: "Overdue" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                filter === f.id 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20" 
                  : "bg-card/30 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden md:block shrink-0 ml-4">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="list" className="data-[state=active]:bg-background"><ListIcon className="w-4 h-4 mr-2" /> List</TabsTrigger>
            <TabsTrigger value="kanban" className="data-[state=active]:bg-background"><LayoutDashboard className="w-4 h-4 mr-2" /> Board</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1">
        {viewMode === "list" ? renderList() : renderKanban()}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("rounded-xl", className)}>{children}</div>;
}

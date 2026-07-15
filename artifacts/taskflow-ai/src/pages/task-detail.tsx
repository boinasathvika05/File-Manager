import { useGetTask, useUpdateTask, useDeleteTask, getGetTaskQueryKey } from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Clock, Trash2, CheckCircle2, Circle, Flag, Target, Battery, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TaskDetail() {
  const [, params] = useRoute("/tasks/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useGetTask(id, {
    query: { enabled: !!id, queryKey: getGetTaskQueryKey(id) }
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [notes, setNotes] = useState("");
  const notesInitRef = useRef<number | null>(null);

  useEffect(() => {
    if (task && notesInitRef.current !== task.id) {
      setNotes(task.notes || "");
      notesInitRef.current = task.id;
    }
  }, [task]);

  const saveNotes = () => {
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { notes } }, {
      onSuccess: (updated) => {
        toast.success("Notes saved");
        queryClient.setQueryData(getGetTaskQueryKey(id), updated);
      }
    });
  };

  const toggleComplete = () => {
    if (!task) return;
    updateTask.mutate({ 
      id: task.id, 
      data: { status: task.status === "completed" ? "pending" : "completed" } 
    }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetTaskQueryKey(id), updated);
        if (updated.status === "completed") {
          toast.success("Task completed! +XP awarded");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate({ id: task.id }, {
        onSuccess: () => {
          toast.success("Task deleted");
          setLocation("/tasks");
        }
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 max-w-4xl mx-auto space-y-4">
      <div className="h-8 w-1/4 bg-muted/20 animate-pulse rounded" />
      <div className="h-16 w-3/4 bg-muted/20 animate-pulse rounded" />
      <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-2xl" />
    </div>;
  }

  if (!task) {
    return <div className="p-8 text-center text-muted-foreground">Task not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/tasks" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
          <Button 
            size="sm" 
            variant={task.status === "completed" ? "secondary" : "default"}
            onClick={toggleComplete}
            className={task.status === "completed" ? "" : "shadow-lg shadow-primary/20"}
          >
            {task.status === "completed" ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Completed</>
            ) : (
              <><Circle className="w-4 h-4 mr-2" /> Mark Complete</>
            )}
          </Button>
        </div>
      </div>

      <div className={cn(
        "bg-card rounded-3xl border border-border p-8 shadow-sm relative overflow-hidden transition-opacity",
        task.status === "completed" && "opacity-80"
      )}>
        {task.status === "completed" && (
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className={cn(
            "uppercase tracking-wider text-[10px] font-bold px-2 py-0.5",
            task.priority === 'urgent' && "border-red-500/30 text-red-500 bg-red-500/10",
            task.priority === 'high' && "border-orange-500/30 text-orange-500 bg-orange-500/10",
            task.priority === 'medium' && "border-yellow-500/30 text-yellow-500 bg-yellow-500/10",
            task.priority === 'low' && "border-blue-500/30 text-blue-500 bg-blue-500/10",
          )}>
            {task.priority} Priority
          </Badge>
          
          {task.categoryName && (
            <Badge variant="outline" className="bg-background" style={{ borderColor: `${task.categoryColor}40`, color: task.categoryColor || 'inherit' }}>
              {task.categoryName}
            </Badge>
          )}
        </div>

        <h1 className={cn(
          "text-3xl md:text-4xl font-bold tracking-tight mb-4",
          task.status === "completed" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h1>
        
        {task.description && (
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-3xl">
            {task.description}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-background/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Due Date</div>
                <div className="font-medium text-sm">{task.dueDate ? format(new Date(task.dueDate), "MMM do, yyyy") : "No date"}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Est. Time</div>
                <div className="font-medium text-sm">{task.estimatedMinutes ? `${task.estimatedMinutes} min` : "Not set"}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Difficulty</div>
                <div className="font-medium text-sm capitalize">{task.difficulty || "Not set"}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Battery className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Energy</div>
                <div className="font-medium text-sm capitalize">{task.energyLevel || "Not set"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-border pt-8 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              Execution Notes
            </h3>
            <Button size="sm" variant="secondary" onClick={saveNotes} disabled={updateTask.isPending || notes === task.notes}>
              Save Notes
            </Button>
          </div>
          <Textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add markdown notes, scratchpad info, or post-completion reflections..."
            className="min-h-[200px] bg-background/50 font-mono text-sm leading-relaxed resize-y border-border/50"
          />
        </div>
      </div>
    </div>
  );
}

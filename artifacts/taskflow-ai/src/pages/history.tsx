import { useListHistory } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CheckCircle2, PlusCircle, Trash2, RotateCcw, Edit2, Archive, LogIn, Activity } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { data: history, isLoading } = useListHistory({ limit: 50 });

  if (isLoading) {
    return <div className="p-8 max-w-3xl mx-auto space-y-4">
      {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-xl" />)}
    </div>;
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <PlusCircle className="w-5 h-5 text-blue-500" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'deleted': return <Trash2 className="w-5 h-5 text-destructive" />;
      case 'updated': return <Edit2 className="w-5 h-5 text-orange-500" />;
      case 'archived': return <Archive className="w-5 h-5 text-muted-foreground" />;
      case 'restored': return <RotateCcw className="w-5 h-5 text-primary" />;
      case 'login': return <LogIn className="w-5 h-5 text-purple-500" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Audit trail of all actions.</p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
        {history?.map((item) => (
          <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
              {getActionIcon(item.action)}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card/50 backdrop-blur-sm border border-border/50 p-4 rounded-xl shadow-sm hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {item.action}
                </span>
                <time className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded border border-border/50">
                  {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                </time>
              </div>
              <div className="text-base font-medium text-foreground">
                {item.taskId ? (
                  <Link href={`/tasks/${item.taskId}`} className="hover:text-primary transition-colors hover:underline">
                    {item.taskTitle}
                  </Link>
                ) : (
                  item.taskTitle
                )}
              </div>
            </div>
          </div>
        ))}

        {history?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border ml-12 md:ml-0 z-10 relative">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}

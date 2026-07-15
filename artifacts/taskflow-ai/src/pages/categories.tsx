import { useListCategories, useCreateCategory } from "@workspace/api-client-react";
import { useState } from "react";
import { Folder, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { getListCategoriesQueryKey } from "@workspace/api-client-react";

export default function Categories() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    createCategory.mutate({
      data: { name, color }
    }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        setColor("#8b5cf6");
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your domain.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 gap-2">
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Engineering, Personal, Finance" 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="font-mono text-sm uppercase"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createCategory.isPending}>
                {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl" />)}
        </div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-card/30">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">No categories yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Create one to start organizing tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories?.map((category) => (
            <Card key={category.id} className="overflow-hidden border-border/50 hover:border-border transition-colors group cursor-pointer bg-card/50 backdrop-blur-sm">
              <div className="h-2 w-full" style={{ backgroundColor: category.color }} />
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="text-sm text-muted-foreground font-medium">{category.taskCount || 0} tasks</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

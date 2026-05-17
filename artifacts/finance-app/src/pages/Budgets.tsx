import { useState } from "react";
import { 
  useListBudgets, getListBudgetsQueryKey,
  useCreateBudget,
  useDeleteBudget
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Budgets() {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [open, setOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");

  const { data: budgets, isLoading } = useListBudgets(
    { month: currentMonth },
    { query: { queryKey: getListBudgetsQueryKey({ month: currentMonth }) } }
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteBudget = useDeleteBudget();
  const createBudget = useCreateBudget();

  const handleDelete = (id: number) => {
    deleteBudget.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Budget removed" });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
      }
    });
  };

  const handleAddBudget = () => {
    if (!newBudgetCategory || !newBudgetAmount) return;
    createBudget.mutate({
      data: {
        category: newBudgetCategory,
        amount: Number(newBudgetAmount),
        month: currentMonth
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setNewBudgetCategory("");
        setNewBudgetAmount("");
        toast({ title: "Budget created" });
        queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
      }
    });
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-destructive";
    if (percent >= 80) return "bg-orange-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">Keep your spending in check</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/> Set Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newBudgetCategory} onValueChange={setNewBudgetCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monthly Limit (₹)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={newBudgetAmount}
                  onChange={e => setNewBudgetAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddBudget} disabled={createBudget.isPending}>
                {createBudget.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
        ) : budgets?.length === 0 ? (
          <Card className="col-span-full border-none shadow-sm bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="font-medium text-lg">No budgets set</p>
              <p className="text-muted-foreground mb-4">Set limits for categories to stay on track.</p>
              <Button variant="outline" onClick={() => setOpen(true)}>Create First Budget</Button>
            </CardContent>
          </Card>
        ) : (
          budgets?.map((budget) => {
            const percent = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
            const colorClass = getProgressColor(percent);
            
            return (
              <Card key={budget.id} className="border-none shadow-sm hover-elevate transition-all">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">{budget.category}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)} spent
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive -mt-2 -mr-2"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{percent}%</span>
                      <span className={percent >= 100 ? "text-destructive" : "text-muted-foreground"}>
                        {budget.remaining && budget.remaining > 0 
                          ? `${formatCurrency(budget.remaining)} left` 
                          : "Over budget"}
                      </span>
                    </div>
                    {/* Progress bar needs custom coloring support via inline style or CSS vars. */}
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${colorClass}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Quick hack for Target icon since it wasn't imported in Budgets
import { Target } from "lucide-react";

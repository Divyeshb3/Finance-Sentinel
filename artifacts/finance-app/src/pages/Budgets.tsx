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
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Target, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, useReducedMotion } from "framer-motion";

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
  const prefersReducedMotion = useReducedMotion();

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
    if (percent >= 100) return "hsl(var(--destructive))";
    if (percent >= 80) return "#f59e0b"; // amber-500
    return "hsl(var(--primary))";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Budgets</h2>
          <p className="text-muted-foreground font-medium mt-1">Keep your spending in check</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold px-6 shadow-lg hover:-translate-y-0.5 transition-all gradient-indigo text-white border-none">
              <Plus className="h-5 w-5 mr-2"/> Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl glass-card">
            <DialogHeader className="pt-2">
              <DialogTitle className="text-2xl font-bold">Set Monthly Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</label>
                <Select value={newBudgetCategory} onValueChange={setNewBudgetCategory}>
                  <SelectTrigger className="bg-background/50 h-12 text-base">
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
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Monthly Limit (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                  <Input 
                    type="number" 
                    placeholder="5000" 
                    value={newBudgetAmount}
                    onChange={e => setNewBudgetAmount(e.target.value)}
                    className="pl-8 h-14 text-xl font-bold bg-background/50"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddBudget} 
                disabled={createBudget.isPending}
                className="w-full h-12 rounded-xl font-bold gradient-indigo shadow-lg text-white"
              >
                {createBudget.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="show"
      >
        {isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)
        ) : budgets?.length === 0 ? (
          <div className="col-span-full">
            <Card className="glass-card border-none shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Target className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-2xl mb-2">No budgets set</h3>
                <p className="text-muted-foreground font-medium mb-6">Set limits for categories to stay on track.</p>
                <Button variant="outline" className="rounded-full font-semibold" onClick={() => setOpen(true)}>Create First Budget</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          budgets?.map((budget) => {
            const percent = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
            const colorValue = getProgressColor(percent);
            
            return (
              <motion.div key={budget.id} variants={prefersReducedMotion ? undefined : itemVariants}>
                <Card className="glass-card border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-sm">
                        {budget.category.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{budget.category}</CardTitle>
                        <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted mt-1 w-fit">
                          {percent}% Used
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-8 w-8"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-end justify-between font-medium">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Spent</span>
                          <span className="text-xl font-black">{formatCurrency(budget.spent)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Limit</span>
                          <span className="text-xl font-bold text-muted-foreground">{formatCurrency(budget.amount)}</span>
                        </div>
                      </div>
                      
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative">
                        <motion.div 
                          className="absolute left-0 top-0 bottom-0 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          style={{ backgroundColor: colorValue }}
                        />
                      </div>
                      
                      <div className="pt-2 text-right">
                        <span className={`text-sm font-bold ${percent >= 100 ? "text-destructive" : "text-muted-foreground"}`}>
                          {budget.remaining && budget.remaining > 0 
                            ? `${formatCurrency(budget.remaining)} left` 
                            : "Over budget"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

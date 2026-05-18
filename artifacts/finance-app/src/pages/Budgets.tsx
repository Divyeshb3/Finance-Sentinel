import { useState, useMemo } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { useExpenses } from "@/hooks/useExpenses";
import { addBudget, removeBudget } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, useReducedMotion } from "framer-motion";

export default function Budgets() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [open, setOpen] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const prefersReducedMotion = useReducedMotion();

  const { budgets, loading: loadingBudgets } = useBudgets(currentMonth);
  const { expenses, loading: loadingExpenses } = useExpenses();

  const loading = loadingBudgets || loadingExpenses;

  const budgetsWithSpend = useMemo(() => {
    return budgets.map((budget) => {
      const spent = expenses
        .filter((e) => e.category === budget.category && e.date.startsWith(budget.month))
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = budget.amount - spent;
      return { ...budget, spent, remaining };
    });
  }, [budgets, expenses]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await removeBudget(user.uid, id);
      toast({ title: "Budget removed" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove budget." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount || !user) return;
    setIsPending(true);
    try {
      await addBudget(user.uid, {
        category: newBudgetCategory,
        amount: Number(newBudgetAmount),
        month: currentMonth,
      });
      setOpen(false);
      setNewBudgetCategory("");
      setNewBudgetAmount("");
      toast({ title: "Budget created" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to create budget." });
    } finally {
      setIsPending(false);
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "hsl(var(--destructive))";
    if (percent >= 80) return "#f59e0b";
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
                disabled={isPending}
                className="w-full h-12 rounded-xl font-bold gradient-indigo shadow-lg text-white"
              >
                {isPending ? "Saving..." : "Save Budget"}
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
        {loading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)
        ) : budgetsWithSpend.length === 0 ? (
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
          budgetsWithSpend.map((budget) => {
            const percent = budget.amount > 0 ? Math.min(100, Math.round((budget.spent / budget.amount) * 100)) : 0;
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
                      disabled={deletingId === budget.id}
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
                          {budget.remaining > 0 ? `${formatCurrency(budget.remaining)} left` : "Over budget"}
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

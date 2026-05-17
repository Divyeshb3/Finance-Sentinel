import { useState } from "react";
import { 
  useListExpenses, getListExpensesQueryKey,
  useDeleteExpense, getGetAnalyticsSummaryQueryKey,
  getGetDailyAnalyticsQueryKey, getGetCategoryAnalyticsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Search, Utensils, Plane, ShoppingBag, Smartphone, Film, GraduationCap, HeartPulse, FileText, MoreHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { AddExpenseModal } from "@/components/shared/AddExpenseModal";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Food: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Utensils },
  Travel: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: Plane },
  Shopping: { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: ShoppingBag },
  Recharge: { color: "#6366F1", bg: "rgba(99,102,241,0.12)", icon: Smartphone },
  Entertainment: { color: "#EC4899", bg: "rgba(236,72,153,0.12)", icon: Film },
  Education: { color: "#14B8A6", bg: "rgba(20,184,166,0.12)", icon: GraduationCap },
  Health: { color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: HeartPulse },
  Bills: { color: "#F97316", bg: "rgba(249,115,22,0.12)", icon: FileText },
  Other: { color: "#6B7280", bg: "rgba(107,114,128,0.12)", icon: MoreHorizontal },
};

export default function Expenses() {
  const [category, setCategory] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  
  const { data: expenses, isLoading } = useListExpenses({
    category: category !== "all" ? category : undefined,
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
  }, {
    query: { queryKey: getListExpensesQueryKey({ 
      category: category !== "all" ? category : undefined,
      paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined
    }) }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteExpense = useDeleteExpense();

  const handleDelete = (id: number) => {
    deleteExpense.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Expense deleted" });
        queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "getDailyAnalytics" || query.queryKey[0] === "getCategoryAnalytics" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground font-medium mt-1">Manage your past expenses</p>
        </div>
        <AddExpenseModal>
          <Button className="rounded-xl font-bold px-6 shadow-lg hover:-translate-y-0.5 transition-all gradient-indigo text-white border-none h-12">
            Add Expense
          </Button>
        </AddExpenseModal>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
          <button 
            onClick={() => setCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              category === "all" ? "bg-foreground text-background shadow-md" : "glass-card text-muted-foreground hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                category === c ? "shadow-md" : "glass-card hover:bg-muted"
              }`}
              style={category === c ? { backgroundColor: CATEGORY_CONFIG[c]?.bg, color: CATEGORY_CONFIG[c]?.color } : {}}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
          <button 
            onClick={() => setPaymentMethod("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              paymentMethod === "all" ? "bg-foreground text-background shadow-md" : "glass-card text-muted-foreground hover:bg-muted"
            }`}
          >
            All Methods
          </button>
          {PAYMENT_METHODS.map(m => (
            <button 
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                paymentMethod === m ? "bg-primary text-white shadow-md" : "glass-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <Card className="glass-card border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : expenses?.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <p className="font-bold text-2xl mb-2">No expenses found</p>
              <p className="text-muted-foreground font-medium">Try adjusting your filters or add a new expense.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <AnimatePresence>
                {expenses?.map((expense) => {
                  const conf = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG["Other"];
                  const Icon = conf.icon;
                  
                  return (
                    <motion.div 
                      key={expense.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 hover:bg-white/40 dark:hover:bg-black/20 transition-all gap-4"
                    >
                      <div className="flex items-center gap-5">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                          style={{ backgroundColor: conf.bg, color: conf.color }}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg leading-tight">{expense.description}</p>
                          <div className="flex gap-2 text-sm text-muted-foreground items-center mt-1.5 font-medium">
                            <span>{formatDate(expense.date)}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold"
                              style={{ backgroundColor: conf.bg, color: conf.color }}
                            >
                              {expense.category}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                            <span>{expense.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                        <div className="font-black text-xl tracking-tight">
                          {formatCurrency(expense.amount)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-all rounded-full h-10 w-10"
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleteExpense.isPending}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

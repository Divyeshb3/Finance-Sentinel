import { useState } from "react";
import { 
  useListExpenses, getListExpensesQueryKey,
  useDeleteExpense, getGetAnalyticsSummaryQueryKey,
  getGetDailyAnalyticsQueryKey, getGetCategoryAnalyticsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Search, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AddExpenseModal } from "@/components/shared/AddExpenseModal";

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
        queryClient.invalidateQueries({ queryKey: getGetDailyAnalyticsQueryKey({ startDate: "", endDate: "" }) });
        queryClient.invalidateQueries({ queryKey: getGetCategoryAnalyticsQueryKey({}) });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">Manage your past transactions</p>
        </div>
        <AddExpenseModal>
          <Button>Add Expense</Button>
        </AddExpenseModal>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg">All Transactions</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : expenses?.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Search className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="font-medium text-lg">No expenses found</p>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or add a new expense.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {expenses?.map((expense) => (
                <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 hover:bg-muted/30 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-lg shrink-0">
                      {expense.category.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{expense.description}</p>
                      <div className="flex gap-2 text-sm text-muted-foreground items-center mt-1">
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span className="inline-flex items-center bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                          {expense.category}
                        </span>
                        <span>•</span>
                        <span>{expense.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                    <div className="font-bold text-lg">
                      {formatCurrency(expense.amount)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteExpense.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

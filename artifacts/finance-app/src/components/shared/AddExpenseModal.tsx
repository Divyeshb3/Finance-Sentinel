import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addExpense } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Utensils, Plane, ShoppingBag, Smartphone, 
  Film, GraduationCap, HeartPulse, FileText, 
  MoreHorizontal, CreditCard, Banknote, SmartphoneNfc, Wallet
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Food: <Utensils className="w-5 h-5" />,
  Travel: <Plane className="w-5 h-5" />,
  Shopping: <ShoppingBag className="w-5 h-5" />,
  Recharge: <Smartphone className="w-5 h-5" />,
  Entertainment: <Film className="w-5 h-5" />,
  Education: <GraduationCap className="w-5 h-5" />,
  Health: <HeartPulse className="w-5 h-5" />,
  Bills: <FileText className="w-5 h-5" />,
  Other: <MoreHorizontal className="w-5 h-5" />
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  Cash: <Banknote className="w-4 h-4" />,
  UPI: <SmartphoneNfc className="w-4 h-4" />,
  Card: <CreditCard className="w-4 h-4" />,
  "Net Banking": <FileText className="w-4 h-4" />,
  Wallet: <Wallet className="w-4 h-4" />
};

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(2, "Description is too short").max(100, "Description is too long"),
  category: z.string().min(1, "Please select a category"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  date: z.string().min(1, "Please select a date"),
});

export function AddExpenseModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    setIsPending(true);
    try {
      await addExpense(user.uid, values);
      setOpen(false);
      form.reset({ amount: 0, description: "", category: "", paymentMethod: "", date: new Date().toISOString().split("T")[0] });
      toast({ title: "Expense added", description: "Your expense has been recorded." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add expense. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl glass-card">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">Add Expense</DialogTitle>
            <DialogDescription>
              Record a new transaction to track your spending.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex justify-center mb-8">
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-bold text-muted-foreground">₹</span>
                      <FormControl>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className="text-5xl font-extrabold bg-transparent border-none outline-none focus:ring-0 w-full pl-8 py-2 max-w-[200px]"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">What was it for?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lunch at cafeteria" className="bg-background/50 border-border/50 text-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <div 
                            key={cat}
                            onClick={() => field.onChange(cat)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                              field.value === cat 
                                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                : "bg-background/50 border-border/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <div className="mb-1">{CATEGORY_ICONS[cat]}</div>
                            <span className="text-[10px] font-medium">{cat}</span>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Method</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {PAYMENT_METHODS.map((method) => (
                            <div 
                              key={method}
                              onClick={() => field.onChange(method)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                                field.value === method
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background/50 text-muted-foreground border-border/50 hover:bg-muted"
                              }`}
                            >
                              {METHOD_ICONS[method] || null}
                              {method}
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background/50 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={isPending} 
                  className="w-full h-12 text-base font-bold gradient-indigo shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                >
                  {isPending ? "Adding..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

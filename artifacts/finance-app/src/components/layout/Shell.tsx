import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Target, 
  Lightbulb, 
  BotMessageSquare,
  Plus
} from "lucide-react";
import { AddExpenseModal } from "@/components/shared/AddExpenseModal";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Assistant", href: "/assistant", icon: BotMessageSquare },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background">
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center p-2 pb-safe">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
              location === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"
            }`}>
              <item.icon className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xl">F</span>
            </div>
            FinWise
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <AddExpenseModal>
            <Button className="w-full gap-2 hover-elevate">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </AddExpenseModal>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <AddExpenseModal>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg hover-elevate">
            <Plus className="h-6 w-6" />
          </Button>
        </AddExpenseModal>
      </div>
    </div>
  );
}

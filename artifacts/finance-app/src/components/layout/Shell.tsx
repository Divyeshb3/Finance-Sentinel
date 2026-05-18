import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Target, 
  Sparkles, 
  Bot,
  Plus,
  LogOut
} from "lucide-react";
import { AddExpenseModal } from "@/components/shared/AddExpenseModal";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: CreditCard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Insights", href: "/insights", icon: Sparkles },
  { name: "Assistant", href: "/assistant", icon: Bot },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

function UserAvatar({ photoURL, displayName, email }: { photoURL?: string | null; displayName?: string | null; email?: string | null }) {
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : email
    ? email[0].toUpperCase()
    : "?";

  if (photoURL) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px] shrink-0">
        <img
          src={photoURL}
          alt={displayName ?? "User"}
          className="w-full h-full rounded-full object-cover border-2 border-[#0B1020]"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px] shrink-0">
      <div className="w-full h-full rounded-full bg-[#0B1020] flex items-center justify-center">
        <span className="text-xs font-bold text-white">{initials}</span>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logOut();
    } catch {
      toast({ title: "Logout failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";
  const shortName = displayName.length > 16 ? displayName.slice(0, 16) + "…" : displayName;

  return (
    <div className="flex min-h-[100dvh] w-full flex-col md:flex-row bg-background">
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-white/10 flex justify-around items-center p-2 bg-sidebar/80 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all duration-200 relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavIndicator"
                    className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_2px_rgba(91,108,249,0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(91,108,249,0.5)]" : ""}`} />
                <span className="text-[10px] font-medium opacity-80">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-[#0B1020] text-sidebar-foreground">
        <div className="p-6 pb-2">
          <Link href="/">
            <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight cursor-pointer group">
              <div className="w-9 h-9 rounded-xl gradient-indigo flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300">
                <span className="text-white font-black text-xl leading-none">F</span>
              </div>
              <span className="text-white">Fin<span className="gradient-text font-extrabold">Wise</span></span>
            </h1>
          </Link>
        </div>

        <motion.nav 
          className="flex-1 px-4 space-y-1 mt-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="show"
        >
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <motion.div key={item.href} variants={prefersReducedMotion ? undefined : itemVariants}>
                <Link href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "text-white"
                      : "text-sidebar-foreground/70 hover:text-white hover:bg-white/5"
                  }`}>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavBackground"
                        className="absolute inset-0 gradient-indigo opacity-20"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(91,108,249,0.8)]" />
                    )}
                    <item.icon className={`h-5 w-5 relative z-10 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(91,108,249,0.5)]" : ""}`} />
                    <span className="relative z-10">{item.name}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        <div className="p-4 border-t border-sidebar-border/50 space-y-4">
          <AddExpenseModal>
            <Button className="w-full gap-2 h-12 rounded-xl gradient-indigo text-white shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 border-none font-semibold">
              <Plus className="h-5 w-5" />
              Add Expense
            </Button>
          </AddExpenseModal>
          
          {/* User profile + logout */}
          <div className="flex items-center gap-3 px-2">
            <UserAvatar
              photoURL={user?.photoURL}
              displayName={user?.displayName}
              email={user?.email}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{shortName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email ?? ""}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="shrink-0 p-2 rounded-lg text-sidebar-foreground/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sign out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <AddExpenseModal>
          <Button size="icon" className="h-14 w-14 rounded-full gradient-indigo text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all border-none">
            <Plus className="h-6 w-6" />
          </Button>
        </AddExpenseModal>
      </div>
    </div>
  );
}

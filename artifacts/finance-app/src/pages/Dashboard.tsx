import { 
  useGetAnalyticsSummary, 
  getGetAnalyticsSummaryQueryKey,
  useGetHealthScore,
  getGetHealthScoreQueryKey,
  useGetInsights,
  getGetInsightsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertCircle, Sparkles, Receipt, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const prefersReducedMotion = useReducedMotion();
  const { data: summary, isLoading: isLoadingSummary } = useGetAnalyticsSummary({
    query: { queryKey: getGetAnalyticsSummaryQueryKey() }
  });
  
  const { data: health, isLoading: isLoadingHealth } = useGetHealthScore({
    query: { queryKey: getGetHealthScoreQueryKey() }
  });

  const { data: insights, isLoading: isLoadingInsights } = useGetInsights({
    query: { queryKey: getGetInsightsQueryKey() }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Fallback data for chart if empty
  const chartData = summary?.categorySpend?.length ? summary.categorySpend : [{ category: "No Data", total: 1 }];

  return (
    <motion.div 
      className="space-y-8"
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={prefersReducedMotion ? undefined : itemVariants} className="pt-2 pb-4">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">{today}</p>
        <h2 className="text-4xl font-extrabold tracking-tight">Your Money, Your Story.</h2>
      </motion.div>

      {/* Top metrics row */}
      <motion.div variants={prefersReducedMotion ? undefined : itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="glass-card border-none shadow-sm h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-muted-foreground">Today's Spend</h3>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold tracking-tight">{formatCurrency(summary?.todayTotal || 0)}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="glass-card border-none shadow-sm h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-chart-2/5 rounded-bl-full -z-10" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center text-chart-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-muted-foreground">This Week</h3>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold tracking-tight">{formatCurrency(summary?.weekTotal || 0)}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="glass-card border-none shadow-sm h-full relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-chart-4/5 rounded-bl-full -z-10" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center text-chart-4">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-muted-foreground">This Month</h3>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold tracking-tight">{formatCurrency(summary?.monthTotal || 0)}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-none shadow-lg h-full relative overflow-hidden gradient-indigo text-white">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full" />
            <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-tr-full" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ArrowDownRight className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white/90">Est. Savings</h3>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-8 w-24 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold tracking-tight">{formatCurrency(summary?.savingsEstimate || 0)}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Health Score Gauge */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="glass-card border-none shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financial Health</CardTitle>
              <CardDescription>Based on recent activity</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
              {isLoadingHealth ? (
                <Skeleton className="w-40 h-40 rounded-full" />
              ) : (
                <>
                  <div className="relative flex items-center justify-center w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50" cy="50" r="45"
                        fill="transparent" stroke="currentColor" strokeWidth="8"
                        className="text-muted opacity-50"
                      />
                      {/* Foreground Arc */}
                      <motion.circle
                        cx="50" cy="50" r="45"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 282.7` }}
                        animate={{ strokeDasharray: `${((health?.score || 0) / 100) * 282.7} 282.7` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`${
                          (health?.score || 0) >= 80 ? 'text-emerald-500' :
                          (health?.score || 0) >= 60 ? 'text-amber-500' : 'text-rose-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-black tracking-tighter">{health?.grade || 'C'}</span>
                      <span className="text-sm font-semibold text-muted-foreground mt-1">{health?.score || 0}/100</span>
                    </div>
                  </div>
                  {health?.message && (
                    <div className="mt-6 px-4 py-2 rounded-full bg-muted/50 border border-border/50 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-medium text-foreground">{health.message}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category spending pie chart */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="glass-card border-none shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Where your money goes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center pb-6">
              {isLoadingSummary ? (
                <Skeleton className="w-48 h-48 rounded-full" />
              ) : (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="total"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Expenses List */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="glass-card border-none shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent</CardTitle>
              <Link href="/expenses" className="text-sm font-semibold text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoadingSummary ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : summary?.recentExpenses?.length ? (
                <div className="space-y-3">
                  {summary.recentExpenses.slice(0, 4).map((expense, idx) => (
                    <div key={expense.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                          {expense.category.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{expense.description}</p>
                          <p className="text-[11px] text-muted-foreground font-medium mt-1">{formatDate(expense.date)} • {expense.category}</p>
                        </div>
                      </div>
                      <div className="font-bold text-sm">
                        {formatCurrency(expense.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-sm font-semibold">No recent expenses</p>
                  <p className="text-xs text-muted-foreground mt-1">Start tracking to see activity here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights strip */}
      {!isLoadingInsights && insights && insights.length > 0 && (
        <motion.div variants={prefersReducedMotion ? undefined : containerVariants} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
          {insights.slice(0, 3).map((insight) => {
            const isDanger = insight.severity === 'danger';
            const isWarning = insight.severity === 'warning';
            
            return (
              <motion.div key={insight.id} variants={prefersReducedMotion ? undefined : itemVariants} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card className={`border-none shadow-sm relative overflow-hidden h-full ${
                  isDanger ? 'bg-destructive/10' : 
                  isWarning ? 'bg-orange-500/10' : 'bg-primary/5'
                }`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isDanger ? 'bg-destructive' : 
                    isWarning ? 'bg-orange-500' : 'bg-primary'
                  }`} />
                  <CardContent className="p-5 flex gap-4">
                    <div className={`mt-1 shrink-0 ${
                      isDanger ? 'text-destructive' : 
                      isWarning ? 'text-orange-500' : 'text-primary'
                    }`}>
                      {isDanger ? <AlertCircle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-tight mb-1.5 text-foreground">{insight.title}</h4>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">{insight.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

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
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertCircle, Lightbulb, Receipt } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetAnalyticsSummary({
    query: { queryKey: getGetAnalyticsSummaryQueryKey() }
  });
  
  const { data: health, isLoading: isLoadingHealth } = useGetHealthScore({
    query: { queryKey: getGetHealthScoreQueryKey() }
  });

  const { data: insights, isLoading: isLoadingInsights } = useGetInsights({
    query: { queryKey: getGetInsightsQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>

      {/* Top metrics row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate transition-all border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Spend</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.todayTotal || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.weekTotal || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="hover-elevate transition-all border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.monthTotal || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-none shadow-sm bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Est. Savings</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-primary-foreground/80" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24 bg-primary-foreground/20" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.savingsEstimate || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Health Score Gauge */}
        <Card className="col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
            <CardDescription>Based on your recent activity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {isLoadingHealth ? (
              <Skeleton className="w-32 h-32 rounded-full" />
            ) : (
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${(health?.score || 0) * 2.827} 282.7`}
                    className="text-primary transition-all duration-1000 ease-in-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold">{health?.grade || 'C'}</span>
                  <span className="text-sm text-muted-foreground">{health?.score || 0}/100</span>
                </div>
              </div>
            )}
            {!isLoadingHealth && health?.message && (
              <p className="mt-4 text-sm text-center text-muted-foreground">
                {health.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses List */}
        <Card className="col-span-2 md:col-span-5 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Link href="/expenses" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : summary?.recentExpenses?.length ? (
              <div className="space-y-4">
                {summary.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {expense.category.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)} • {expense.category}</p>
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm font-medium">No recent expenses</p>
                <p className="text-xs text-muted-foreground mb-4">Start tracking to see your activity here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Snippet */}
      {!isLoadingInsights && insights && insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {insights.slice(0, 3).map((insight) => (
            <Card key={insight.id} className={`border-none shadow-sm hover-elevate transition-all ${
              insight.severity === 'danger' ? 'bg-destructive/10' : 
              insight.severity === 'warning' ? 'bg-orange-500/10' : 'bg-primary/5'
            }`}>
              <CardContent className="p-4 flex gap-3">
                {insight.severity === 'danger' ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <Lightbulb className={`h-5 w-5 shrink-0 ${insight.severity === 'warning' ? 'text-orange-500' : 'text-primary'}`} />
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground">{insight.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

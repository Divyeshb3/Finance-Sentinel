import { useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { computeDailyAnalytics, computeCategoryAnalytics, computeComparison } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))'];

export default function Analytics() {
  const { expenses, loading } = useExpenses();

  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date().toISOString().slice(0, 10);

  const dailyData = useMemo(() => computeDailyAnalytics(expenses, startDate, endDate), [expenses, startDate, endDate]);
  const categoryData = useMemo(() => computeCategoryAnalytics(expenses, startDate, endDate), [expenses, startDate, endDate]);
  const comparisonData = useMemo(() => computeComparison(expenses), [expenses]);

  const totalSpend = dailyData.reduce((acc, curr) => acc + curr.total, 0);
  const avgDaily = dailyData.length ? totalSpend / dailyData.length : 0;
  const topCategory = categoryData[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-extrabold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground font-medium mt-1">Deep dive into your spending patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total (30 Days)</p>
            {loading ? <Skeleton className="h-8 w-32" /> : <div className="text-3xl font-black">{formatCurrency(totalSpend)}</div>}
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg Daily</p>
            {loading ? <Skeleton className="h-8 w-32" /> : <div className="text-3xl font-black">{formatCurrency(avgDaily)}</div>}
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-chart-2" />
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Category</p>
            {loading ? <Skeleton className="h-8 w-32" /> : <div className="text-3xl font-black truncate">{topCategory?.category || "N/A"}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="trend" className="rounded-lg font-semibold">Daily Trend</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg font-semibold">Categories</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-lg font-semibold">Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend" className="mt-0">
          <Card className="glass-card border-none shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold">Spending Trend</CardTitle>
              <CardDescription>Your daily spending over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full rounded-xl" />
              ) : dailyData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => { const d = new Date(val); return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`; }}
                        stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10}
                      />
                      <YAxis 
                        tickFormatter={(val) => `₹${val}`}
                        stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-10}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => [formatCurrency(value), "Spent"]}
                        labelFormatter={(label) => new Date(label as string).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" isAnimationActive activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Add expenses to see your trend</p>
                    <p className="text-sm text-muted-foreground mt-1">Your daily spending chart will appear here once you start tracking.</p>
                  </div>
                  <Link href="/expenses">
                    <Button variant="outline" className="rounded-xl font-semibold mt-2">Start tracking expenses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {loading ? (
                  <Skeleton className="h-[300px] w-full rounded-full" />
                ) : categoryData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="total" nameKey="category" stroke="none">
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center gap-3 text-center">
                    <PieChartIcon className="h-10 w-10 text-muted-foreground opacity-30" />
                    <p className="font-semibold text-muted-foreground">Add expenses to see your category breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : categoryData.length > 0 ? (
                  <div className="space-y-6">
                    {categoryData.map((cat, idx) => {
                      const percent = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0;
                      return (
                        <div key={cat.category} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="font-semibold">{cat.category}</span>
                            <span className="font-bold">{formatCurrency(cat.total)}</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] gap-3 text-center">
                    <BarChart2 className="h-10 w-10 text-muted-foreground opacity-30" />
                    <p className="font-semibold text-muted-foreground">No category data yet</p>
                    <p className="text-xs text-muted-foreground">Add expenses to see how you spend across categories.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-0">
          <Card className="glass-card border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Period Comparison</CardTitle>
              <CardDescription>This week vs last week</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full rounded-xl" />
              ) : (comparisonData.thisWeek > 0 || comparisonData.lastWeek > 0) ? (
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">This Week</p>
                      <p className="text-5xl font-black">{formatCurrency(comparisonData.thisWeek)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last Week</p>
                      <p className="text-3xl font-bold text-muted-foreground">{formatCurrency(comparisonData.lastWeek)}</p>
                    </div>
                    <div>
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${comparisonData.weekChange > 0 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {comparisonData.weekChange > 0 ? '↑ Up' : '↓ Down'} {Math.abs(comparisonData.weekChange).toFixed(1)}% vs last week
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ name: 'Last Week', amount: comparisonData.lastWeek }, { name: 'This Week', amount: comparisonData.thisWeek }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} fontWeight={600} />
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={60}>
                          {[{ name: 'Last Week' }, { name: 'This Week' }].map((_, index) => (
                            <Cell key={`cell-${index}`} fill={index === 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <BarChart2 className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">No spending data to compare</p>
                    <p className="text-sm text-muted-foreground mt-1">Add expenses this week and last week to see a comparison.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

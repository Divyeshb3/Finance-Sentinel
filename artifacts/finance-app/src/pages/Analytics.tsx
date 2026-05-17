import { 
  useGetDailyAnalytics, getGetDailyAnalyticsQueryKey,
  useGetCategoryAnalytics, getGetCategoryAnalyticsQueryKey,
  useGetSpendingComparison, getGetSpendingComparisonQueryKey
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))'];

export default function Analytics() {
  // Just use arbitrary dates for demo since API doesn't strictly enforce dates
  const startDate = "2024-01-01";
  const endDate = "2024-12-31";

  const { data: dailyData, isLoading: isLoadingDaily } = useGetDailyAnalytics(
    { startDate, endDate },
    { query: { queryKey: getGetDailyAnalyticsQueryKey({ startDate, endDate }) } }
  );

  const { data: categoryData, isLoading: isLoadingCategory } = useGetCategoryAnalytics(
    { startDate, endDate },
    { query: { queryKey: getGetCategoryAnalyticsQueryKey({ startDate, endDate }) } }
  );

  const { data: comparisonData, isLoading: isLoadingComparison } = useGetSpendingComparison({
    query: { queryKey: getGetSpendingComparisonQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Deep dive into your spending patterns</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily Spending Trend */}
        <Card className="md:col-span-2 lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Your daily spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDaily ? (
              <Skeleton className="h-[300px] w-full" />
            ) : dailyData && dailyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                      }}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `₹${val}`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Spent"]}
                      labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCategory ? (
              <Skeleton className="h-[300px] w-full rounded-full" />
            ) : categoryData && categoryData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="category"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison */}
        <Card className="md:col-span-2 lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Spending Comparison</CardTitle>
            <CardDescription>This week vs last week</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingComparison ? (
              <Skeleton className="h-[250px] w-full" />
            ) : comparisonData ? (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">This Week</span>
                    <span className="font-bold text-lg">{formatCurrency(comparisonData.thisWeek)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Last Week</span>
                    <span className="font-bold text-lg">{formatCurrency(comparisonData.lastWeek)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Change</span>
                    <span className={`font-bold flex items-center ${comparisonData.weekChange > 0 ? 'text-destructive' : 'text-primary'}`}>
                      {comparisonData.weekChange > 0 ? '+' : ''}{comparisonData.weekChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Last Week', amount: comparisonData.lastWeek },
                      { name: 'This Week', amount: comparisonData.thisWeek }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

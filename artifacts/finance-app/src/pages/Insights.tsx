import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Lightbulb, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Insights() {
  const { data: insights, isLoading } = useGetInsights({
    query: { queryKey: getGetInsightsQueryKey() }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
          <p className="text-muted-foreground">Smart analysis of your spending habits</p>
        </div>
        <Link href="/assistant">
          <Button variant="outline" className="gap-2">
            Ask Assistant <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : insights?.length === 0 ? (
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="font-medium text-lg">No insights yet</p>
              <p className="text-muted-foreground">Keep tracking your expenses. We need more data to analyze your habits.</p>
            </CardContent>
          </Card>
        ) : (
          insights?.map((insight) => (
            <Card key={insight.id} className={`border-none shadow-sm hover-elevate transition-all overflow-hidden relative
              ${insight.severity === 'danger' ? 'bg-destructive/5 border-l-4 border-l-destructive' : 
                insight.severity === 'warning' ? 'bg-orange-500/5 border-l-4 border-l-orange-500' : 
                'bg-primary/5 border-l-4 border-l-primary'}`}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-full shrink-0 h-fit
                    ${insight.severity === 'danger' ? 'bg-destructive/10 text-destructive' : 
                      insight.severity === 'warning' ? 'bg-orange-500/10 text-orange-500' : 
                      'bg-primary/10 text-primary'}`}
                  >
                    {insight.severity === 'danger' ? <AlertCircle className="h-6 w-6" /> : 
                     insight.severity === 'warning' ? <TrendingDown className="h-6 w-6" /> :
                     <Lightbulb className="h-6 w-6" />}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                      {insight.savingsPotential && (
                        <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                          Save {formatCurrency(insight.savingsPotential)}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground">{insight.message}</p>
                    
                    {insight.amount && (
                      <div className="mt-4 inline-flex items-center bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium">
                        Identified Amount: <span className="ml-2 font-bold text-foreground">{formatCurrency(insight.amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

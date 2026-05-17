import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Lightbulb, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";

export default function Insights() {
  const prefersReducedMotion = useReducedMotion();
  const { data: insights, isLoading } = useGetInsights({
    query: { queryKey: getGetInsightsQueryKey() }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">AI Insights</h2>
          <p className="text-muted-foreground font-medium mt-1">Smart analysis of your spending habits</p>
        </div>
        <Link href="/assistant">
          <Button className="gap-2 rounded-full font-semibold px-6 shadow-md hover:shadow-lg transition-all bg-white text-primary border border-primary/20 hover:bg-muted dark:bg-[#0B1020] dark:text-white dark:border-white/10 dark:hover:bg-white/5">
            Ask Assistant <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <motion.div 
        className="grid gap-6"
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="show"
      >
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
        ) : insights?.length === 0 ? (
          <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
            <Card className="glass-card border-none shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="font-bold text-2xl mb-2">No insights yet</h3>
                <p className="text-muted-foreground font-medium max-w-sm">Keep tracking your expenses. We need more data to analyze your habits and find savings opportunities.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          insights?.map((insight) => {
            const isDanger = insight.severity === 'danger';
            const isWarning = insight.severity === 'warning';
            
            return (
              <motion.div key={insight.id} variants={prefersReducedMotion ? undefined : itemVariants}>
                <Card className={`glass-card border-none shadow-md overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    isDanger ? 'bg-rose-500' : 
                    isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                  }`} />
                  
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                        ${isDanger ? 'bg-rose-500/10 text-rose-500' : 
                          isWarning ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-indigo-500/10 text-indigo-500'}`}
                      >
                        {isDanger ? <AlertCircle className="h-7 w-7" /> : 
                         isWarning ? <TrendingDown className="h-7 w-7" /> :
                         <Lightbulb className="h-7 w-7" />}
                      </div>
                      
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <h3 className="text-xl font-bold tracking-tight text-foreground">{insight.title}</h3>
                          {insight.savingsPotential && (
                            <div className="bg-emerald-500 text-white shadow-sm px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase inline-flex items-center w-fit">
                              Save {formatCurrency(insight.savingsPotential)}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">{insight.message}</p>
                        
                        {insight.amount && (
                          <div className="mt-4 inline-flex items-center bg-background/80 px-4 py-2 rounded-xl border border-border text-sm font-semibold shadow-sm">
                            Identified Amount: <span className="ml-2 font-black text-foreground">{formatCurrency(insight.amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

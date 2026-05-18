import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToBudgets, type Budget } from "@/lib/firestore";

export function useBudgets(month: string) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToBudgets(user.uid, month, (data) => {
      setBudgets(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid, month]);

  return { budgets, loading };
}

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToExpenses, type Expense } from "@/lib/firestore";

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToExpenses(user.uid, (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  return { expenses, loading };
}

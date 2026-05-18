import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  date: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string;
  createdAt: number;
}

export interface NewExpense {
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  date: string;
}

export interface NewBudget {
  category: string;
  amount: number;
  month: string;
}

function expensesRef(uid: string) {
  return collection(db, "users", uid, "expenses");
}

function budgetsRef(uid: string) {
  return collection(db, "users", uid, "budgets");
}

export function subscribeToExpenses(uid: string, cb: (expenses: Expense[]) => void): Unsubscribe {
  const q = query(expensesRef(uid), orderBy("date", "desc"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Expense, "id">),
      }))
    );
  });
}

export function subscribeToBudgets(uid: string, month: string, cb: (budgets: Budget[]) => void): Unsubscribe {
  const q = query(budgetsRef(uid), where("month", "==", month));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Budget, "id">),
      }))
    );
  });
}

export async function addExpense(uid: string, expense: NewExpense): Promise<string> {
  const ref = await addDoc(expensesRef(uid), {
    ...expense,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function removeExpense(uid: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "expenses", expenseId));
}

export async function addBudget(uid: string, budget: NewBudget): Promise<string> {
  const ref = await addDoc(budgetsRef(uid), {
    ...budget,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function removeBudget(uid: string, budgetId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "budgets", budgetId));
}

export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  userId: string;
  description?: string;
}

export interface CategorySummary {
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categories: Record<string, CategorySummary>;
  mostFrequentCategory?: string;
  largestTransaction?: {
    amount: number;
    description: string;
    category: string;
  };
}

export interface MonthlyStatsResponse {
  months: MonthlyStat[];
  averageIncome: number;
  averageExpense: number;
  trend: "up" | "down" | "stable";
}

import { Request, Response, NextFunction } from 'express';
import { db } from '../services/firebase/firebase.service';
import { ApiError } from '../utils/apiError';

// stats.interface.ts
export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
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
  trend: 'up' | 'down' | 'stable';
}

// Função auxiliar para buscar transações
async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const snapshot = await db.collection('transactions')
    .where('userId', '==', userId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[];
}

// Resumo financeiro geral
export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, 'Usuário não autenticado');
    }

    const transactions = await getUserTransactions(req.user.uid);
    const summary: FinancialSummary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categories: {}
    };

    let largestTransaction: { amount: number; description: string; category: string } | null = null;
    const categoryCounts: Record<string, number> = {};

    // Processa todas as transações
    transactions.forEach(transaction => {
      // Atualiza totais
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
      } else {
        summary.totalExpense += transaction.amount;
      }

      // Atualiza estatísticas por categoria
      const category = transaction.category;
      if (!summary.categories[category]) {
        summary.categories[category] = { total: 0, count: 0, percentage: 0 };
      }

      summary.categories[category].total += transaction.amount;
      summary.categories[category].count += 1;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Verifica maior transação
      if (!largestTransaction || Math.abs(transaction.amount) > Math.abs(largestTransaction.amount)) {
        largestTransaction = {
          amount: transaction.amount,
          description: transaction.description || 'Sem descrição',
          category: transaction.category
        };
      }
    });

    // Calcula balanço
    summary.balance = summary.totalIncome - summary.totalExpense;

    // Calcula porcentagens e categoria mais frequente
    let maxCount = 0;
    Object.keys(summary.categories).forEach(category => {
      const cat = summary.categories[category];
      // CORREÇÃO: Usar o tipo da categoria para determinar se é income ou expense
      const isIncomeCategory = transactions.some(t => t.category === category && t.type === 'income');
      const total = isIncomeCategory ? summary.totalIncome : summary.totalExpense;
      cat.percentage = total > 0 ? (cat.total / total) * 100 : 0;

      if (categoryCounts[category] > maxCount) {
        maxCount = categoryCounts[category];
        summary.mostFrequentCategory = category;
      }
    });

    if (largestTransaction) {
      summary.largestTransaction = largestTransaction;
    }

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Erro ao gerar resumo financeiro'));
  }
};

// Estatísticas mensais
export const getMonthlyStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.uid) {
      throw new ApiError(401, 'Usuário não autenticado');
    }

    const transactions = await getUserTransactions(req.user.uid);
    const monthlyData: Record<string, MonthlyStat> = {};
    const response: MonthlyStatsResponse = {
      months: [],
      averageIncome: 0,
      averageExpense: 0,
      trend: 'stable'
    };

    // Agrupa por mês
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          income: 0,
          expense: 0,
          balance: 0
        };
      }

      if (transaction.type === 'income') {
        monthlyData[monthYear].income += transaction.amount;
      } else {
        monthlyData[monthYear].expense += transaction.amount;
      }
    });

    // Calcula balanço e prepara array ordenado
    response.months = Object.values(monthlyData)
      .map(month => ({
        ...month,
        balance: month.income - month.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calcula médias e tendência
    if (response.months.length > 0) {
      response.averageIncome = response.months.reduce((sum, month) => sum + month.income, 0) / response.months.length;
      response.averageExpense = response.months.reduce((sum, month) => sum + month.expense, 0) / response.months.length;

      // Determina tendência (últimos 3 meses)
      if (response.months.length >= 3) {
        const lastMonths = response.months.slice(-3);
        const balanceTrend = lastMonths[2].balance - lastMonths[0].balance;
        
        if (balanceTrend > 0) response.trend = 'up';
        else if (balanceTrend < 0) response.trend = 'down';
      }
    }

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(500, 'Erro ao gerar estatísticas mensais'));
  }
};
export const StatsController = {
  getMonthlyStats,
  getSummary
};
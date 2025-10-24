import { db } from '../services/firebase/firebase.service';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Transaction } from '../types/express/transactions'; // Assumindo que você moveu a interface

export const TransactionModel = {
  async create(transaction: Omit<Transaction, 'id'>): Promise<string> {
    try {
      const docRef = await db.collection('transactions').add({
        ...transaction,
        date: transaction.date || FirebaseFirestoreTypes.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação no banco de dados');
    }
  },

  async findByUser(userId: string): Promise<Transaction[]> {
    try {
      const snapshot = await db
        .collection('transactions')
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          value: data.value,
          type: data.type,
          category: data.category,
          date: data.date?.toDate() || new Date(),
          description: data.description || ''
        };
      });
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Falha ao recuperar transações');
    }
  },

  async getBalance(userId: string): Promise<{ income: number; expense: number; balance: number }> {
    const transactions = await this.findByUser(userId);
    
    const summary = transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc.income += t.value;
      } else {
        acc.expense += t.value;
      }
      return acc;
    }, { income: 0, expense: 0 });

    return {
      ...summary,
      balance: summary.income - summary.expense
    };
  }
};
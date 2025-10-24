import { db } from '../services/firebase/firebase.service';
import { Categoria } from '../types/categoria';

export const CategoryModel = {
  async findByUser(userId: string): Promise<Categoria[]> {
    const snapshot = await db.collection('categorias')
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Categoria[];
  }
};
import { db } from "../services/firebase/firebase.service";
import { FieldValue } from "firebase-admin/firestore";

interface UserData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  deviceId?: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export const UserModel = {
  async findById(userId: string): Promise<UserData | null> {
    const doc = await db.collection("usuarios").doc(userId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as UserData) : null;
  },

  async update(userId: string, data: Partial<UserData>): Promise<void> {
    await db
      .collection("usuarios")
      .doc(userId)
      .update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      });
  },

  async deleteById(userId: string) {
    try {
      await db.collection("usuarios").doc(userId).delete();
    } catch (error) {
      throw new Error("Falha ao deletar usuário do Firestore");
    }
  },
};

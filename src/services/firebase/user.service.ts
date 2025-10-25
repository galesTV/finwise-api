import { db, FieldValue } from "./firebase.service";
import { ApiError } from "../../utils/apiError";

// Tipos para o usuário
interface UserData {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  createdAt?: FirebaseFirestore.Timestamp | Date;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
  emailVerified?: boolean;
  status?: string;
}

export class UserService {
  private static readonly usersCollection = "usuarios";

  //Verifica se um usuário já existe no banco de dados
  static async checkUserExists(uid: string): Promise<boolean> {
    try {
      const userDoc = await db.collection(this.usersCollection).doc(uid).get();
      return userDoc.exists;
    } catch (error) {
      console.error("Error checking user existence:", error);
      throw new ApiError(500, "Error checking user");
    }
  }

  //Cria um novo usuário no banco de dados
  static async createUser(
    userData: Omit<
      UserData,
      "createdAt" | "updatedAt" | "emailVerified" | "status"
    >
  ) {
    try {
      const userRef = db.collection(this.usersCollection).doc(userData.uid);

      const newUser = {
        ...userData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        emailVerified: false,
        status: "active",
      };

      await userRef.set(newUser);

      return newUser;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw new ApiError(500, "Falha ao criar registro do usuário");
    }
  }

  //Obtém informações do usuário pelo UID
  static async getUserById(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await db.collection(this.usersCollection).doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as UserData;
    } catch (error) {
      console.error("Error getting user:", error);
      throw new ApiError(500, "Error getting user");
    }
  }

  //Atualiza informações do usuário
  static async updateUser(uid: string, updateData: Partial<UserData>) {
    try {
      const userRef = db.collection(this.usersCollection).doc(uid);

      await userRef.update({
        ...updateData,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new ApiError(500, "Error updating user");
    }
  }
}

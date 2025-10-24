import { auth, db, FieldValue, FirebaseAdminError } from './firebase.service';
import { ApiError } from '../../utils/apiError';

interface MobileUserData {
  uid: string;
  email: string;
  name: string;
  phone?: string;
}

export class AuthService {
  // Registro para mobile
  static async registerMobile(email: string, password: string, name: string, phone?: string) {
    try {
      // Verificar se o email já existe
      try {
        await auth.getUserByEmail(email);
        throw new ApiError(400, 'Email já está em uso');
      } catch (error) {
        if (error instanceof Error && (error as FirebaseAdminError).code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // 1. Criar usuário no Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        ...(phone && { phoneNumber: phone })
      });

      // 2. Criar documento completo no Firestore
      const userData = {
        name,
        email,
        phone: phone || null,
        nickname: null,
        birthDate: null,
        gender: null,
        postalCode: null,
        city: null,
        state: null,
        financialGoal: null,
        emailVerified: false,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection('usuarios').doc(userRecord.uid).set(userData);

      // Gerar token
      const customToken = await auth.createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name,
        phone,
        idToken: customToken,
        refreshToken: ''
      };
    } catch (error) {
      console.error('Erro detalhado no registro:', error);
      throw new ApiError(500, 'Erro durante o registro');
    }
  }

  // Login para mobile
  static async loginMobile(email: string, password: string) {
    try {
      // Verificar usuário no Firebase Auth
      const userRecord = await auth.getUserByEmail(email);
      
      // Obter dados adicionais do Firestore
      const userDoc = await db.collection('usuarios').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        throw new ApiError(404, 'Usuário não encontrado');
      }

      const userData = userDoc.data() as MobileUserData;

      // Gera um token customizado
      const customToken = await auth.createCustomToken(userRecord.uid);

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        phone: userData.phone,
        idToken: customToken,
        refreshToken: '' // O Firebase gerencia isso no cliente
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      const firebaseError = error as FirebaseAdminError;
      console.error('Erro no login:', firebaseError);
      
      throw new ApiError(401, 'Credenciais inválidas');
    }
  }

  // Verificar e renovar tokens
  static async refreshToken(refreshToken: string) {
    // No Firebase, o refresh é gerenciado pelo SDK do cliente
    // Podemos apenas verificar o token existente
    try {
      const decoded = await auth.verifyIdToken(refreshToken);
      const newToken = await auth.createCustomToken(decoded.uid);

      return {
        idToken: newToken,
        refreshToken: '' // O Firebase gerencia isso automaticamente no cliente
      };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw new ApiError(401, 'Refresh token inválido ou expirado');
    }
  }
}
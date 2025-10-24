import { User } from 'firebase/auth'; // Ou seu tipo de usuário personalizado

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        // Adicione outras propriedades do usuário conforme necessário
      };
    }
  }
}
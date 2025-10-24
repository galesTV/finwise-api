import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { auth } from '../services/firebase/firebase.service';

declare module 'express' {
  interface Request {
    user?: {
      uid: string;
      email?: string;
      name?: string;
    };
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Token não fornecido');
    }

    const token = authHeader.split(' ')[1];

    // Verificar token do Firebase
    const decoded = await auth.verifyIdToken(token);

    // Verifica se o usuário ainda existe
    const user = await auth.getUser(decoded.uid);
    
    req.user = { 
      uid: decoded.uid,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error instanceof ApiError) {
      return next(error);
    }
    
    next(new ApiError(401, 'Token inválido ou expirado'));
  }
};

export const authenticate = authMiddleware;